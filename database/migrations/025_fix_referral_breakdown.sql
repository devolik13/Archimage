-- Миграция 025: Добавляем обновление airdrop_breakdown в process_referral
-- Чтобы реферальные очки отображались в детализации

CREATE OR REPLACE FUNCTION process_referral(
    p_referrer_telegram_id BIGINT,
    p_referred_telegram_id BIGINT,
    p_reward_time INTEGER DEFAULT 1440,
    p_reward_points INTEGER DEFAULT 200
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referrer_id INTEGER;
    v_referrer_username TEXT;
    v_referred_id INTEGER;
    v_already_exists BOOLEAN;
    v_current_breakdown JSONB;
    v_current_referral_points INTEGER;
BEGIN
    -- Проверяем, не пытается ли игрок пригласить себя
    IF p_referrer_telegram_id = p_referred_telegram_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'self_referral');
    END IF;

    -- Проверяем, не был ли уже обработан этот реферал
    SELECT EXISTS(
        SELECT 1 FROM referrals WHERE referred_telegram_id = p_referred_telegram_id
    ) INTO v_already_exists;

    IF v_already_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'already_processed');
    END IF;

    -- Получаем данные реферера
    SELECT id, username INTO v_referrer_id, v_referrer_username
    FROM players
    WHERE telegram_id = p_referrer_telegram_id;

    IF v_referrer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'referrer_not_found');
    END IF;

    -- Получаем id нового игрока
    SELECT id INTO v_referred_id
    FROM players
    WHERE telegram_id = p_referred_telegram_id;

    IF v_referred_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'referred_not_found');
    END IF;

    -- Начисляем награду рефереру (включая breakdown)
    SELECT COALESCE(airdrop_breakdown, '{}'::jsonb) INTO v_current_breakdown
    FROM players WHERE id = v_referrer_id;

    v_current_referral_points := COALESCE((v_current_breakdown->>'Приглашение друга')::INTEGER, 0);

    UPDATE players
    SET
        time_currency = COALESCE(time_currency, 0) + p_reward_time,
        airdrop_points = COALESCE(airdrop_points, 0) + p_reward_points,
        airdrop_breakdown = v_current_breakdown ||
            jsonb_build_object('Приглашение друга', v_current_referral_points + p_reward_points)
    WHERE id = v_referrer_id;

    -- Начисляем награду новому игроку (включая breakdown)
    SELECT COALESCE(airdrop_breakdown, '{}'::jsonb) INTO v_current_breakdown
    FROM players WHERE id = v_referred_id;

    v_current_referral_points := COALESCE((v_current_breakdown->>'Приглашение друга')::INTEGER, 0);

    UPDATE players
    SET
        time_currency = COALESCE(time_currency, 0) + p_reward_time,
        airdrop_points = COALESCE(airdrop_points, 0) + p_reward_points,
        airdrop_breakdown = v_current_breakdown ||
            jsonb_build_object('Приглашение друга', v_current_referral_points + p_reward_points)
    WHERE id = v_referred_id;

    -- Записываем реферал в таблицу
    INSERT INTO referrals (
        referrer_telegram_id,
        referred_telegram_id,
        reward_amount,
        reward_claimed,
        total_purchase_bonus
    ) VALUES (
        p_referrer_telegram_id,
        p_referred_telegram_id,
        p_reward_time,
        true,
        0
    );

    RETURN jsonb_build_object(
        'success', true,
        'referrer_username', v_referrer_username,
        'reward_time', p_reward_time,
        'reward_points', p_reward_points
    );
END;
$$;
