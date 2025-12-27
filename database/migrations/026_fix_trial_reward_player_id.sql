-- ============================================
-- Исправление функций начисления наград
-- Проблема: использовался id вместо telegram_id
-- ============================================

-- Исправляем claim_trial_reward
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

    -- Начисляем время игроку (ИСПРАВЛЕНО: telegram_id вместо id)
    UPDATE players
    SET time_currency = COALESCE(time_currency, 0) + v_reward_time
    WHERE telegram_id = p_player_id;

    RETURN v_reward_time;
END;
$$;

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

    -- Начисляем время игроку (ИСПРАВЛЕНО: telegram_id вместо id)
    UPDATE players
    SET time_currency = COALESCE(time_currency, 0) + v_result.reward_time
    WHERE telegram_id = p_player_id;

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

COMMENT ON FUNCTION claim_trial_reward IS 'Забирает награду и начисляет время (исправлено: telegram_id)';
COMMENT ON FUNCTION auto_claim_trial_reward IS 'Автоматически начисляет награду за прошлую неделю при входе (исправлено: telegram_id)';
