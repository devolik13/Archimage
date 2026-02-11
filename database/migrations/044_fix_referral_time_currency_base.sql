-- Migration 044: Fix process_referral to use time_currency_base (lazy accrual)
-- Problem: process_referral updates old `time_currency` column, but since migration 041
-- the system uses `time_currency_base` as source of truth. This causes referral time
-- rewards to be LOST when the player's data is next saved (time_currency gets overwritten
-- by time_currency_base value).
--
-- Fix: Use get_time_currency() to calculate current balance, add reward, then update
-- time_currency_base (same approach as add_time_currency RPC).

CREATE OR REPLACE FUNCTION process_referral(
    p_referrer_telegram_id BIGINT,
    p_referred_telegram_id BIGINT,
    p_reward_time INTEGER DEFAULT 1440,
    p_reward_points INTEGER DEFAULT 200,
    p_referrer_reward_time INTEGER DEFAULT NULL,
    p_referrer_reward_points INTEGER DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referrer_id INTEGER;
    v_referrer_username TEXT;
    v_referrer_tg_id BIGINT;
    v_referred_id INTEGER;
    v_referred_tg_id BIGINT;
    v_already_exists BOOLEAN;
    v_referrer_time INTEGER;
    v_referrer_points INTEGER;
    v_current_breakdown JSONB;
    v_current_value INTEGER;
    v_current_balance INTEGER;
    v_new_base INTEGER;
BEGIN
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
    SELECT id, username, telegram_id INTO v_referrer_id, v_referrer_username, v_referrer_tg_id
    FROM players
    WHERE telegram_id = p_referrer_telegram_id;

    IF v_referrer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'referrer_not_found');
    END IF;

    -- Получаем id нового игрока
    SELECT id, telegram_id INTO v_referred_id, v_referred_tg_id
    FROM players
    WHERE telegram_id = p_referred_telegram_id;

    IF v_referred_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'referred_not_found');
    END IF;

    -- ============================================================
    -- Начисляем УБЫВАЮЩУЮ награду РЕФЕРЕРУ (time via time_currency_base)
    -- ============================================================
    -- Рассчитываем текущий баланс через get_time_currency (учитывает накопление)
    v_current_balance := get_time_currency(v_referrer_tg_id);
    v_new_base := LEAST(v_current_balance + v_referrer_time, 999999);

    -- Обновляем breakdown
    SELECT COALESCE(airdrop_breakdown, '{}'::jsonb) INTO v_current_breakdown
    FROM players WHERE id = v_referrer_id;

    v_current_value := COALESCE((v_current_breakdown->>'Приглашение друга')::integer, 0);

    UPDATE players
    SET
        time_currency_base = v_new_base,
        time_currency_updated_at = now(),
        time_currency = v_new_base,  -- Keep old column in sync
        airdrop_points = COALESCE(airdrop_points, 0) + v_referrer_points,
        airdrop_breakdown = jsonb_set(
            v_current_breakdown,
            '{Приглашение друга}',
            to_jsonb(v_current_value + v_referrer_points)
        )
    WHERE id = v_referrer_id;

    -- ============================================================
    -- Начисляем ПОЛНУЮ награду НОВОМУ ИГРОКУ (time via time_currency_base)
    -- ============================================================
    v_current_balance := get_time_currency(v_referred_tg_id);
    v_new_base := LEAST(v_current_balance + p_reward_time, 999999);

    SELECT COALESCE(airdrop_breakdown, '{}'::jsonb) INTO v_current_breakdown
    FROM players WHERE id = v_referred_id;

    v_current_value := COALESCE((v_current_breakdown->>'Приглашение друга')::integer, 0);

    UPDATE players
    SET
        time_currency_base = v_new_base,
        time_currency_updated_at = now(),
        time_currency = v_new_base,  -- Keep old column in sync
        airdrop_points = COALESCE(airdrop_points, 0) + p_reward_points,
        airdrop_breakdown = jsonb_set(
            v_current_breakdown,
            '{Приглашение друга}',
            to_jsonb(v_current_value + p_reward_points)
        )
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
        v_referrer_time,
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
