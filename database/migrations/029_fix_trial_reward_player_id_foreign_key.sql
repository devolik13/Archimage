-- ============================================
-- Migration 029: Fix trial_rewards player_id foreign key issue
-- Problem: INSERT uses telegram_id but foreign key references players.id
-- Solution: Look up players.id from telegram_id before INSERT
-- ============================================

-- Исправляем auto_claim_trial_reward
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
    v_internal_player_id INTEGER;  -- внутренний id игрока
BEGIN
    -- Получаем внутренний id игрока по telegram_id
    SELECT id INTO v_internal_player_id
    FROM players
    WHERE telegram_id = p_player_id;

    -- Если игрок не найден - выходим
    IF v_internal_player_id IS NULL THEN
        RETURN QUERY SELECT
            false::boolean,
            0::bigint,
            0::bigint,
            0::float,
            0::int,
            0::int,
            'Игрок не найден'::text;
        RETURN;
    END IF;

    -- Проверяем, не получена ли уже награда за эту неделю
    -- Используем внутренний id для проверки в trial_rewards
    SELECT EXISTS(
        SELECT 1 FROM trial_rewards
        WHERE player_id = v_internal_player_id AND week_year = p_week_year
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
    -- ВАЖНО: get_player_week_result ожидает внутренний id (player_id в trial_leaderboard)
    SELECT * INTO v_result FROM get_player_week_result(v_internal_player_id, p_week_year);

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

    -- Начисляем время игроку (используем telegram_id для players)
    UPDATE players
    SET time_currency = COALESCE(time_currency, 0) + v_result.reward_time
    WHERE telegram_id = p_player_id;

    -- Записываем что награда получена (используем внутренний id для trial_rewards)
    INSERT INTO trial_rewards (player_id, week_year, rank_position, rank_percent, reward_tier, reward_time, claimed, claimed_at)
    VALUES (
        v_internal_player_id,  -- ИСПРАВЛЕНО: используем внутренний id
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

-- Также исправляем claim_trial_reward для консистентности
CREATE OR REPLACE FUNCTION claim_trial_reward(p_reward_id uuid, p_player_id bigint)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reward_time int;
    v_internal_player_id INTEGER;
BEGIN
    -- Получаем внутренний id игрока
    SELECT id INTO v_internal_player_id
    FROM players
    WHERE telegram_id = p_player_id;

    IF v_internal_player_id IS NULL THEN
        RETURN 0;
    END IF;

    -- Получаем и помечаем награду как полученную
    UPDATE trial_rewards
    SET claimed = true, claimed_at = now()
    WHERE id = p_reward_id AND player_id = v_internal_player_id AND claimed = false
    RETURNING reward_time INTO v_reward_time;

    IF v_reward_time IS NULL THEN
        RETURN 0;
    END IF;

    -- Начисляем время игроку
    UPDATE players
    SET time_currency = COALESCE(time_currency, 0) + v_reward_time
    WHERE telegram_id = p_player_id;

    RETURN v_reward_time;
END;
$$;

-- Исправляем upsert_trial_result - он тоже использует telegram_id вместо внутреннего id
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
    v_internal_player_id INTEGER;
BEGIN
    v_week_year := get_current_week_year();

    -- Получаем внутренний id игрока
    SELECT id INTO v_internal_player_id
    FROM players
    WHERE telegram_id = p_player_id;

    IF v_internal_player_id IS NULL THEN
        RETURN;  -- Игрок не найден
    END IF;

    -- Используем внутренний id для trial_leaderboard
    INSERT INTO trial_leaderboard (player_id, player_name, week_year, best_damage, total_damage, attempts_count)
    VALUES (v_internal_player_id, p_player_name, v_week_year, p_damage, p_damage, 1)
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

-- Исправляем get_player_week_result - принимает telegram_id, ищет по внутреннему id
CREATE OR REPLACE FUNCTION get_player_week_result(p_player_id bigint, p_week_year text)
RETURNS TABLE (
    rank bigint,
    total_players bigint,
    percent float,
    best_damage int,
    reward_time int
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_internal_player_id INTEGER;
BEGIN
    -- Проверяем, передан ли telegram_id или внутренний id
    -- Если число > 1000000, скорее всего это telegram_id
    IF p_player_id > 1000000 THEN
        SELECT id INTO v_internal_player_id
        FROM players
        WHERE telegram_id = p_player_id;
    ELSE
        v_internal_player_id := p_player_id;
    END IF;

    RETURN QUERY
    WITH ranked AS (
        SELECT
            tl.player_id,
            tl.best_damage,
            ROW_NUMBER() OVER (ORDER BY tl.best_damage DESC) as rk,
            COUNT(*) OVER () as total
        FROM trial_leaderboard tl
        WHERE tl.week_year = p_week_year
    )
    SELECT
        r.rk,
        r.total as total_players,
        (r.rk::float / r.total * 100) as percent,
        r.best_damage,
        CASE
            WHEN (r.rk::float / r.total * 100) <= 1 THEN 10080   -- 7 дней
            WHEN (r.rk::float / r.total * 100) <= 5 THEN 4320   -- 3 дня
            WHEN (r.rk::float / r.total * 100) <= 10 THEN 2880  -- 2 дня
            WHEN (r.rk::float / r.total * 100) <= 25 THEN 1440  -- 1 день
            WHEN (r.rk::float / r.total * 100) <= 50 THEN 720   -- 12 часов
            ELSE 360                                             -- 6 часов
        END as reward_time
    FROM ranked r
    WHERE r.player_id = v_internal_player_id;
END;
$$;

-- Исправляем get_player_trial_rank
CREATE OR REPLACE FUNCTION get_player_trial_rank(p_player_id bigint)
RETURNS TABLE (
    rank bigint,
    total_players bigint,
    percent float
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_internal_player_id INTEGER;
BEGIN
    -- Если число > 1000000, скорее всего это telegram_id
    IF p_player_id > 1000000 THEN
        SELECT id INTO v_internal_player_id
        FROM players
        WHERE telegram_id = p_player_id;
    ELSE
        v_internal_player_id := p_player_id;
    END IF;

    RETURN QUERY
    WITH ranked AS (
        SELECT
            tl.player_id,
            ROW_NUMBER() OVER (ORDER BY best_damage DESC) as rk,
            COUNT(*) OVER () as total
        FROM trial_leaderboard tl
        WHERE week_year = get_current_week_year()
    )
    SELECT
        r.rk,
        r.total as total_players,
        (r.rk::float / r.total * 100) as percent
    FROM ranked r
    WHERE r.player_id = v_internal_player_id;
END;
$$;

-- Исправляем get_unclaimed_trial_rewards
CREATE OR REPLACE FUNCTION get_unclaimed_trial_rewards(p_player_id bigint)
RETURNS TABLE (
    id uuid,
    week_year text,
    rank_position int,
    rank_percent float,
    reward_tier text,
    reward_time int
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_internal_player_id INTEGER;
BEGIN
    -- Если число > 1000000, скорее всего это telegram_id
    IF p_player_id > 1000000 THEN
        SELECT players.id INTO v_internal_player_id
        FROM players
        WHERE players.telegram_id = p_player_id;
    ELSE
        v_internal_player_id := p_player_id;
    END IF;

    RETURN QUERY
    SELECT tr.id, tr.week_year, tr.rank_position, tr.rank_percent, tr.reward_tier, tr.reward_time
    FROM trial_rewards tr
    WHERE tr.player_id = v_internal_player_id AND tr.claimed = false
    ORDER BY tr.created_at DESC;
END;
$$;

COMMENT ON FUNCTION auto_claim_trial_reward IS 'Автоматически начисляет награду за прошлую неделю при входе (исправлено: конвертация telegram_id -> players.id)';
COMMENT ON FUNCTION claim_trial_reward IS 'Забирает награду и начисляет время (исправлено: конвертация telegram_id -> players.id)';
COMMENT ON FUNCTION upsert_trial_result IS 'Сохраняет результат попытки испытания (исправлено: конвертация telegram_id -> players.id)';
COMMENT ON FUNCTION get_player_week_result IS 'Возвращает результат игрока за конкретную неделю (поддерживает telegram_id и players.id)';
COMMENT ON FUNCTION get_player_trial_rank IS 'Возвращает позицию игрока в рейтинге (поддерживает telegram_id и players.id)';
COMMENT ON FUNCTION get_unclaimed_trial_rewards IS 'Возвращает незабранные награды игрока (поддерживает telegram_id и players.id)';
