-- ============================================
-- Migration: Add leaderboard position bonus with 1000+ participants check
-- ============================================

-- Обновляем функцию get_player_week_result чтобы добавить бонус за место
-- Бонус за место выдаётся ТОЛЬКО если участников >= 1000
CREATE OR REPLACE FUNCTION get_player_week_result(p_player_id bigint, p_week_year text)
RETURNS TABLE (
    rank bigint,
    total_players bigint,
    percent float,
    best_damage int,
    reward_time int,
    position_bonus int
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
        -- Базовая награда по проценту
        CASE
            WHEN (r.rank::float / r.total * 100) <= 1 THEN 10080   -- 7 дней
            WHEN (r.rank::float / r.total * 100) <= 5 THEN 4320   -- 3 дня
            WHEN (r.rank::float / r.total * 100) <= 10 THEN 2880  -- 2 дня
            WHEN (r.rank::float / r.total * 100) <= 25 THEN 1440  -- 1 день
            WHEN (r.rank::float / r.total * 100) <= 50 THEN 720   -- 12 часов
            ELSE 360                                               -- 6 часов
        END as reward_time,
        -- Бонус за место (только если участников >= 1000)
        CASE
            WHEN r.total < 1000 THEN 0  -- Недостаточно участников для бонусов
            WHEN r.rank = 1 THEN 4320   -- 1 место: +3 дня
            WHEN r.rank = 2 THEN 2880   -- 2 место: +2 дня
            WHEN r.rank = 3 THEN 1440   -- 3 место: +1 день
            WHEN r.rank <= 10 THEN 720  -- 4-10 место: +12 часов
            WHEN r.rank <= 50 THEN 240  -- 11-50 место: +4 часа
            ELSE 0
        END as position_bonus
    FROM ranked r
    WHERE r.player_id = p_player_id;
$$;

-- Обновляем функцию auto_claim_trial_reward чтобы начислять бонус за место
CREATE OR REPLACE FUNCTION auto_claim_trial_reward(p_player_id bigint, p_week_year text)
RETURNS TABLE (
    success boolean,
    rank bigint,
    total_players bigint,
    percent float,
    best_damage int,
    reward_time int,
    position_bonus int,
    message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result RECORD;
    v_already_claimed boolean;
    v_total_reward int;
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
            0::int,
            'Награда уже получена'::text;
        RETURN;
    END IF;

    -- Получаем результат игрока за неделю (теперь включает position_bonus)
    SELECT * INTO v_result FROM get_player_week_result(p_player_id, p_week_year);

    IF v_result IS NULL OR v_result.rank IS NULL THEN
        RETURN QUERY SELECT
            false::boolean,
            0::bigint,
            0::bigint,
            0::float,
            0::int,
            0::int,
            0::int,
            'Нет результатов за эту неделю'::text;
        RETURN;
    END IF;

    -- Считаем общую награду (базовая + бонус за место)
    v_total_reward := v_result.reward_time + COALESCE(v_result.position_bonus, 0);

    -- Начисляем время игроку (базовая + бонус)
    UPDATE players
    SET time_currency = COALESCE(time_currency, 0) + v_total_reward
    WHERE id = p_player_id;

    -- Записываем что награда получена (сохраняем общую сумму)
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
        v_total_reward,  -- Сохраняем общую награду (базовая + бонус)
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
        COALESCE(v_result.position_bonus, 0)::int,
        CASE
            WHEN v_result.position_bonus > 0 THEN 'Награда начислена! + бонус за место'
            ELSE 'Награда начислена!'
        END::text;
END;
$$;

COMMENT ON FUNCTION get_player_week_result IS 'Возвращает результат игрока за неделю с расчётом награды и бонуса за место';
COMMENT ON FUNCTION auto_claim_trial_reward IS 'Автоматически начисляет награду за прошлую неделю (включая бонус за место при 1000+ участников)';
