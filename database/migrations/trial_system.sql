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
    player_id uuid REFERENCES players(id) ON DELETE CASCADE,
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
    player_id uuid REFERENCES players(id) ON DELETE CASCADE,
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
-- ============================================

-- Включаем RLS
ALTER TABLE trial_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_rewards ENABLE ROW LEVEL SECURITY;

-- === TRIAL_LEADERBOARD ===

-- Все могут видеть рейтинг (публичный)
CREATE POLICY "trial_leaderboard_select_all" ON trial_leaderboard
    FOR SELECT
    USING (true);

-- Игрок может вставлять/обновлять только свои записи
CREATE POLICY "trial_leaderboard_insert_own" ON trial_leaderboard
    FOR INSERT
    WITH CHECK (player_id = auth.uid());

CREATE POLICY "trial_leaderboard_update_own" ON trial_leaderboard
    FOR UPDATE
    USING (player_id = auth.uid())
    WITH CHECK (player_id = auth.uid());

-- Удалять может только сервис (для еженедельного сброса)
-- Без политики DELETE - только через service_role

-- === TRIAL_REWARDS ===

-- Игрок видит только свои награды
CREATE POLICY "trial_rewards_select_own" ON trial_rewards
    FOR SELECT
    USING (player_id = auth.uid());

-- Вставлять награды может только сервис (service_role)
-- Без политики INSERT для обычных пользователей

-- Игрок может обновить только claimed статус своей награды
CREATE POLICY "trial_rewards_update_claim" ON trial_rewards
    FOR UPDATE
    USING (player_id = auth.uid())
    WITH CHECK (player_id = auth.uid());

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
    p_player_id uuid,
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
END;
$$;

-- Функция для получения рейтинга текущей недели
CREATE OR REPLACE FUNCTION get_trial_leaderboard(p_limit int DEFAULT 100)
RETURNS TABLE (
    rank bigint,
    player_id uuid,
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

-- Функция для расчёта наград (вызывается раз в неделю)
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

-- ============================================
-- КОММЕНТАРИИ
-- ============================================
COMMENT ON TABLE trial_leaderboard IS 'Еженедельный рейтинг испытания (тренировочный манекен)';
COMMENT ON TABLE trial_rewards IS 'Награды за испытание по итогам недели';
COMMENT ON FUNCTION upsert_trial_result IS 'Сохраняет результат попытки испытания';
COMMENT ON FUNCTION get_trial_leaderboard IS 'Возвращает рейтинг текущей недели';
COMMENT ON FUNCTION calculate_weekly_trial_rewards IS 'Рассчитывает награды по итогам недели (вызывать раз в неделю)';
