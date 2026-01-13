-- ============================================
-- Migration 030: Update trial leaderboard rewards
-- Changes:
-- 1. Add minimum 10000 participants for leaderboard rewards
-- 2. Change "below 50%" reward from 360 to 180 minutes (3 hours)
-- ============================================

-- Обновляем get_player_week_result с минимумом участников и новыми наградами
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
    v_min_participants CONSTANT INTEGER := 10000;  -- Минимум 10000 участников
BEGIN
    -- Проверяем, передан ли telegram_id или внутренний id
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
            -- Награда за рейтинг только если >= 10000 участников
            WHEN r.total >= v_min_participants THEN
                CASE
                    WHEN (r.rk::float / r.total * 100) <= 1 THEN 10080   -- Топ 1% = 7 дней
                    WHEN (r.rk::float / r.total * 100) <= 5 THEN 4320   -- Топ 5% = 3 дня
                    WHEN (r.rk::float / r.total * 100) <= 10 THEN 2880  -- Топ 10% = 2 дня
                    WHEN (r.rk::float / r.total * 100) <= 25 THEN 1440  -- Топ 25% = 1 день
                    WHEN (r.rk::float / r.total * 100) <= 50 THEN 720   -- Топ 50% = 12 часов
                    ELSE 180                                            -- Ниже 50% = 3 часа
                END
            ELSE 0  -- Нет награды если участников < 10000
        END as reward_time
    FROM ranked r
    WHERE r.player_id = v_internal_player_id;
END;
$$;

COMMENT ON FUNCTION get_player_week_result IS 'Возвращает результат игрока за неделю. Награда за рейтинг только если 10000+ участников';
