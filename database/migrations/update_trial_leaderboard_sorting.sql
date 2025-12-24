-- ============================================
-- Обновление рейтинга испытаний
-- Сортировка по total_damage вместо best_damage
-- ============================================

-- Обновляем функцию получения рейтинга
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
        ROW_NUMBER() OVER (ORDER BY total_damage DESC) as rank,
        player_id,
        player_name,
        best_damage,
        total_damage,
        attempts_count
    FROM trial_leaderboard
    WHERE week_year = get_current_week_year()
    ORDER BY total_damage DESC
    LIMIT p_limit;
$$;

-- Обновляем функцию получения позиции игрока
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
            ROW_NUMBER() OVER (ORDER BY total_damage DESC) as rank,
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

-- Обновляем функцию расчёта наград
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

    -- Создаём награды для каждого участника (сортировка по total_damage)
    FOR r IN (
        SELECT
            player_id,
            ROW_NUMBER() OVER (ORDER BY total_damage DESC) as rank,
            (ROW_NUMBER() OVER (ORDER BY total_damage DESC)::float / v_total_players * 100) as percent
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

-- Обновляем функцию получения результата игрока за неделю
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
            ROW_NUMBER() OVER (ORDER BY total_damage DESC) as rank,
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

COMMENT ON FUNCTION get_trial_leaderboard IS 'Возвращает рейтинг текущей недели (сортировка по total_damage)';
COMMENT ON FUNCTION get_player_trial_rank IS 'Возвращает позицию игрока в рейтинге (по total_damage)';
