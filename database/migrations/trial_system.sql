-- ============================================
-- TRIAL SYSTEM (Испытание) - Supabase Migration
-- ============================================

-- 1. Добавляем колонки в таблицу players
ALTER TABLE players
ADD COLUMN IF NOT EXISTS trial_attempts_today int DEFAULT 0,
ADD COLUMN IF NOT EXISTS trial_last_attempt_date date,
ADD COLUMN IF NOT EXISTS trial_best_damage int DEFAULT 0;

-- 2. Таблица рейтинга по неделям
CREATE TABLE IF NOT EXISTS trial_leaderboard (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id bigint REFERENCES players(id) ON DELETE CASCADE,
    player_name text NOT NULL,
    week_year text NOT NULL, -- формат "2024-51"
    best_damage int DEFAULT 0,
    total_damage int DEFAULT 0,
    attempts_count int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Уникальный индекс: один игрок - одна запись на неделю
    UNIQUE(player_id, week_year)
);

-- 3. Таблица наград
CREATE TABLE IF NOT EXISTS trial_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id bigint REFERENCES players(id) ON DELETE CASCADE,
    week_year text NOT NULL,
    rank_position int NOT NULL, -- место в рейтинге
    rank_percent float NOT NULL, -- процентиль (1.5 = топ 1.5%)
    reward_tier text NOT NULL, -- "legendary", "epic", "rare", "uncommon", "common", "participation"
    reward_time int DEFAULT 0, -- награда в минутах времени
    claimed boolean DEFAULT false,
    claimed_at timestamptz,
    created_at timestamptz DEFAULT now(),

    -- Один игрок - одна награда за неделю
    UNIQUE(player_id, week_year)
);

-- 4. Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_trial_leaderboard_week ON trial_leaderboard(week_year);
CREATE INDEX IF NOT EXISTS idx_trial_leaderboard_damage ON trial_leaderboard(week_year, best_damage DESC);
CREATE INDEX IF NOT EXISTS idx_trial_rewards_player ON trial_rewards(player_id);
CREATE INDEX IF NOT EXISTS idx_trial_rewards_unclaimed ON trial_rewards(player_id, claimed) WHERE claimed = false;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Для Telegram-авторизации (без Supabase Auth)
-- ============================================

-- Включаем RLS
ALTER TABLE trial_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_rewards ENABLE ROW LEVEL SECURITY;

-- === TRIAL_LEADERBOARD ===
-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "trial_leaderboard_select_public" ON trial_leaderboard;
DROP POLICY IF EXISTS "trial_leaderboard_insert_anon" ON trial_leaderboard;
DROP POLICY IF EXISTS "trial_leaderboard_update_anon" ON trial_leaderboard;

-- Публичный рейтинг - все могут читать
CREATE POLICY "trial_leaderboard_select_public" ON trial_leaderboard
    FOR SELECT USING (true);

-- Вставка и обновление через anon ключ (клиент проверяет player_id)
CREATE POLICY "trial_leaderboard_insert_anon" ON trial_leaderboard
    FOR INSERT WITH CHECK (true);

CREATE POLICY "trial_leaderboard_update_anon" ON trial_leaderboard
    FOR UPDATE USING (true) WITH CHECK (true);

-- === TRIAL_REWARDS ===
-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "trial_rewards_select_public" ON trial_rewards;
DROP POLICY IF EXISTS "trial_rewards_update_anon" ON trial_rewards;

-- Все могут читать награды (для отображения своих)
CREATE POLICY "trial_rewards_select_public" ON trial_rewards
    FOR SELECT USING (true);

-- Обновление (для claimed) через anon
CREATE POLICY "trial_rewards_update_anon" ON trial_rewards
    FOR UPDATE USING (true) WITH CHECK (true);

-- Вставка только через service_role (еженедельный расчёт)
-- Нет политики INSERT для anon - используем service_role

-- ============================================
-- ФУНКЦИИ
-- ============================================

-- Функция для получения текущей недели в формате "YYYY-WW"
CREATE OR REPLACE FUNCTION get_current_week_year()
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT to_char(now(), 'IYYY-IW');
$$;

-- Функция для обновления/вставки результата игрока
CREATE OR REPLACE FUNCTION upsert_trial_result(
    p_player_id bigint,
    p_player_name text,
    p_damage int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_week_year text;
BEGIN
    v_week_year := get_current_week_year();

    INSERT INTO trial_leaderboard (player_id, player_name, week_year, best_damage, total_damage, attempts_count)
    VALUES (p_player_id, p_player_name, v_week_year, p_damage, p_damage, 1)
    ON CONFLICT (player_id, week_year) DO UPDATE SET
        best_damage = GREATEST(trial_leaderboard.best_damage, EXCLUDED.best_damage),
        total_damage = trial_leaderboard.total_damage + p_damage,
        attempts_count = trial_leaderboard.attempts_count + 1,
        updated_at = now();

    -- Обновляем лучший результат в players (по telegram_id)
    UPDATE players
    SET trial_best_damage = GREATEST(COALESCE(trial_best_damage, 0), p_damage)
    WHERE telegram_id = p_player_id;
END;
$$;

-- Функция для получения рейтинга текущей недели
CREATE OR REPLACE FUNCTION get_trial_leaderboard(p_limit int DEFAULT 100)
RETURNS TABLE (
    rank bigint,
    player_id bigint,
    player_name text,
    best_damage int,
    total_damage int,
    attempts_count int
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        ROW_NUMBER() OVER (ORDER BY best_damage DESC) as rank,
        player_id,
        player_name,
        best_damage,
        total_damage,
        attempts_count
    FROM trial_leaderboard
    WHERE week_year = get_current_week_year()
    ORDER BY best_damage DESC
    LIMIT p_limit;
$$;

-- Функция для получения позиции игрока в рейтинге
CREATE OR REPLACE FUNCTION get_player_trial_rank(p_player_id bigint)
RETURNS TABLE (
    rank bigint,
    total_players bigint,
    percent float
)
LANGUAGE sql
STABLE
AS $$
    WITH ranked AS (
        SELECT
            player_id,
            ROW_NUMBER() OVER (ORDER BY best_damage DESC) as rank,
            COUNT(*) OVER () as total
        FROM trial_leaderboard
        WHERE week_year = get_current_week_year()
    )
    SELECT
        rank,
        total as total_players,
        (rank::float / total * 100) as percent
    FROM ranked
    WHERE player_id = p_player_id;
$$;

-- Функция для расчёта наград (вызывается раз в неделю через service_role)
CREATE OR REPLACE FUNCTION calculate_weekly_trial_rewards(p_week_year text)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_players int;
    v_rewards_created int := 0;
    r record;
BEGIN
    -- Считаем общее количество участников
    SELECT COUNT(*) INTO v_total_players
    FROM trial_leaderboard
    WHERE week_year = p_week_year;

    IF v_total_players = 0 THEN
        RETURN 0;
    END IF;

    -- Создаём награды для каждого участника
    FOR r IN (
        SELECT
            player_id,
            ROW_NUMBER() OVER (ORDER BY best_damage DESC) as rank,
            (ROW_NUMBER() OVER (ORDER BY best_damage DESC)::float / v_total_players * 100) as percent
        FROM trial_leaderboard
        WHERE week_year = p_week_year
    ) LOOP
        INSERT INTO trial_rewards (player_id, week_year, rank_position, rank_percent, reward_tier, reward_time)
        VALUES (
            r.player_id,
            p_week_year,
            r.rank,
            r.percent,
            CASE
                WHEN r.percent <= 1 THEN 'legendary'
                WHEN r.percent <= 5 THEN 'epic'
                WHEN r.percent <= 10 THEN 'rare'
                WHEN r.percent <= 25 THEN 'uncommon'
                WHEN r.percent <= 50 THEN 'common'
                ELSE 'participation'
            END,
            CASE
                WHEN r.percent <= 1 THEN 10080    -- 7 дней
                WHEN r.percent <= 5 THEN 4320    -- 3 дня
                WHEN r.percent <= 10 THEN 2880   -- 2 дня
                WHEN r.percent <= 25 THEN 1440   -- 1 день
                WHEN r.percent <= 50 THEN 720    -- 12 часов
                ELSE 360                          -- 6 часов
            END
        )
        ON CONFLICT (player_id, week_year) DO NOTHING;

        v_rewards_created := v_rewards_created + 1;
    END LOOP;

    RETURN v_rewards_created;
END;
$$;

-- Функция для получения незабранных наград игрока
CREATE OR REPLACE FUNCTION get_unclaimed_trial_rewards(p_player_id bigint)
RETURNS TABLE (
    id uuid,
    week_year text,
    rank_position int,
    rank_percent float,
    reward_tier text,
    reward_time int
)
LANGUAGE sql
STABLE
AS $$
    SELECT id, week_year, rank_position, rank_percent, reward_tier, reward_time
    FROM trial_rewards
    WHERE player_id = p_player_id AND claimed = false
    ORDER BY created_at DESC;
$$;

-- Функция для получения награды (старая версия с таблицей)
CREATE OR REPLACE FUNCTION claim_trial_reward(p_reward_id uuid, p_player_id bigint)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reward_time int;
BEGIN
    -- Получаем и помечаем награду как полученную
    UPDATE trial_rewards
    SET claimed = true, claimed_at = now()
    WHERE id = p_reward_id AND player_id = p_player_id AND claimed = false
    RETURNING reward_time INTO v_reward_time;

    IF v_reward_time IS NULL THEN
        RETURN 0;
    END IF;

    -- Начисляем время игроку
    UPDATE players
    SET time_currency = COALESCE(time_currency, 0) + v_reward_time
    WHERE id = p_player_id;

    RETURN v_reward_time;
END;
$$;

-- ============================================
-- АВТОМАТИЧЕСКИЕ НАГРАДЫ (упрощённая версия)
-- ============================================

-- Функция для получения результата игрока за конкретную неделю
CREATE OR REPLACE FUNCTION get_player_week_result(p_player_id bigint, p_week_year text)
RETURNS TABLE (
    rank bigint,
    total_players bigint,
    percent float,
    best_damage int,
    reward_time int
)
LANGUAGE sql
STABLE
AS $$
    WITH ranked AS (
        SELECT
            player_id,
            best_damage,
            ROW_NUMBER() OVER (ORDER BY best_damage DESC) as rank,
            COUNT(*) OVER () as total
        FROM trial_leaderboard
        WHERE week_year = p_week_year
    )
    SELECT
        r.rank,
        r.total as total_players,
        (r.rank::float / r.total * 100) as percent,
        r.best_damage,
        CASE
            WHEN (r.rank::float / r.total * 100) <= 1 THEN 10080   -- 7 дней
            WHEN (r.rank::float / r.total * 100) <= 5 THEN 4320   -- 3 дня
            WHEN (r.rank::float / r.total * 100) <= 10 THEN 2880  -- 2 дня
            WHEN (r.rank::float / r.total * 100) <= 25 THEN 1440  -- 1 день
            WHEN (r.rank::float / r.total * 100) <= 50 THEN 720   -- 12 часов
            ELSE 360                                               -- 6 часов
        END as reward_time
    FROM ranked r
    WHERE r.player_id = p_player_id;
$$;

-- Функция для автоматического начисления награды за прошлую неделю
CREATE OR REPLACE FUNCTION auto_claim_trial_reward(p_player_id bigint, p_week_year text)
RETURNS TABLE (
    success boolean,
    rank bigint,
    total_players bigint,
    percent float,
    best_damage int,
    reward_time int,
    message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result RECORD;
    v_already_claimed boolean;
BEGIN
    -- Проверяем, не получена ли уже награда за эту неделю
    SELECT EXISTS(
        SELECT 1 FROM trial_rewards
        WHERE player_id = p_player_id AND week_year = p_week_year
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
        RETURN QUERY SELECT
            false::boolean,
            0::bigint,
            0::bigint,
            0::float,
            0::int,
            0::int,
            'Награда уже получена'::text;
        RETURN;
    END IF;

    -- Получаем результат игрока за неделю
    SELECT * INTO v_result FROM get_player_week_result(p_player_id, p_week_year);

    IF v_result IS NULL OR v_result.rank IS NULL THEN
        RETURN QUERY SELECT
            false::boolean,
            0::bigint,
            0::bigint,
            0::float,
            0::int,
            0::int,
            'Нет результатов за эту неделю'::text;
        RETURN;
    END IF;

    -- Начисляем время игроку
    UPDATE players
    SET time_currency = COALESCE(time_currency, 0) + v_result.reward_time
    WHERE id = p_player_id;

    -- Записываем что награда получена
    INSERT INTO trial_rewards (player_id, week_year, rank_position, rank_percent, reward_tier, reward_time, claimed, claimed_at)
    VALUES (
        p_player_id,
        p_week_year,
        v_result.rank,
        v_result.percent,
        CASE
            WHEN v_result.percent <= 1 THEN 'legendary'
            WHEN v_result.percent <= 5 THEN 'epic'
            WHEN v_result.percent <= 10 THEN 'rare'
            WHEN v_result.percent <= 25 THEN 'uncommon'
            WHEN v_result.percent <= 50 THEN 'common'
            ELSE 'participation'
        END,
        v_result.reward_time,
        true,
        now()
    );

    RETURN QUERY SELECT
        true::boolean,
        v_result.rank,
        v_result.total_players,
        v_result.percent,
        v_result.best_damage,
        v_result.reward_time,
        'Награда начислена!'::text;
END;
$$;

-- ============================================
-- КОММЕНТАРИИ
-- ============================================
COMMENT ON TABLE trial_leaderboard IS 'Еженедельный рейтинг испытания (тренировочный манекен)';
COMMENT ON TABLE trial_rewards IS 'Награды за испытание по итогам недели';
COMMENT ON FUNCTION upsert_trial_result IS 'Сохраняет результат попытки испытания';
COMMENT ON FUNCTION get_trial_leaderboard IS 'Возвращает рейтинг текущей недели';
COMMENT ON FUNCTION get_player_trial_rank IS 'Возвращает позицию игрока в рейтинге';
COMMENT ON FUNCTION calculate_weekly_trial_rewards IS 'Рассчитывает награды по итогам недели (для cron)';
COMMENT ON FUNCTION get_unclaimed_trial_rewards IS 'Возвращает незабранные награды игрока';
COMMENT ON FUNCTION claim_trial_reward IS 'Забирает награду и начисляет время';
COMMENT ON FUNCTION get_player_week_result IS 'Возвращает результат игрока за конкретную неделю с расчётом награды';
COMMENT ON FUNCTION auto_claim_trial_reward IS 'Автоматически начисляет награду за прошлую неделю при входе';
