-- Миграция 036: Убывающие награды для реферера
-- Приглашённый всегда получает полную награду
-- Приглашающий получает убывающую награду (каждый следующий -10%)

-- Обновляем RPC функцию с раздельными наградами
CREATE OR REPLACE FUNCTION process_referral(
    p_referrer_telegram_id BIGINT,
    p_referred_telegram_id BIGINT,
    p_reward_time INTEGER DEFAULT 1440,
    p_reward_points INTEGER DEFAULT 200,
    p_referrer_reward_time INTEGER DEFAULT NULL,  -- Награда реферера (если NULL = p_reward_time)
    p_referrer_reward_points INTEGER DEFAULT NULL -- Награда реферера (если NULL = p_reward_points)
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
    v_referrer_time INTEGER;
    v_referrer_points INTEGER;
BEGIN
    -- Используем раздельные награды если переданы, иначе одинаковые
    v_referrer_time := COALESCE(p_referrer_reward_time, p_reward_time);
    v_referrer_points := COALESCE(p_referrer_reward_points, p_reward_points);

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

    -- Начисляем УБЫВАЮЩУЮ награду рефереру
    UPDATE players
    SET
        time_currency = COALESCE(time_currency, 0) + v_referrer_time,
        airdrop_points = COALESCE(airdrop_points, 0) + v_referrer_points
    WHERE id = v_referrer_id;

    -- Начисляем ПОЛНУЮ награду новому игроку (всегда p_reward_time/p_reward_points)
    UPDATE players
    SET
        time_currency = COALESCE(time_currency, 0) + p_reward_time,
        airdrop_points = COALESCE(airdrop_points, 0) + p_reward_points
    WHERE id = v_referred_id;

    -- Записываем реферал в таблицу (сохраняем награду реферера)
    INSERT INTO referrals (
        referrer_telegram_id,
        referred_telegram_id,
        reward_amount,
        reward_claimed,
        total_purchase_bonus
    ) VALUES (
        p_referrer_telegram_id,
        p_referred_telegram_id,
        v_referrer_time,  -- Сохраняем награду реферера (убывающую)
        true,
        0
    );

    RETURN jsonb_build_object(
        'success', true,
        'referrer_username', v_referrer_username,
        'reward_time', p_reward_time,
        'reward_points', p_reward_points,
        'referrer_reward_time', v_referrer_time,
        'referrer_reward_points', v_referrer_points
    );
END;
$$;

-- Права уже даны в предыдущей миграции
