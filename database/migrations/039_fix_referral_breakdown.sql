-- Миграция 039: Исправление airdrop_breakdown для реферальных наград
-- Проблема: process_referral RPC добавляет airdrop_points рефереру напрямую,
-- но НЕ обновляет airdrop_breakdown → игроки не видят свои реферальные бонусы

-- ============================================================
-- ЧАСТЬ 1: Исправляем RPC функцию process_referral
-- Теперь обновляет airdrop_breakdown для ОБОИХ игроков
-- ============================================================

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
    v_referred_id INTEGER;
    v_already_exists BOOLEAN;
    v_referrer_time INTEGER;
    v_referrer_points INTEGER;
    v_current_breakdown JSONB;
    v_current_value INTEGER;
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

    -- Начисляем УБЫВАЮЩУЮ награду рефереру + обновляем breakdown
    SELECT COALESCE(airdrop_breakdown, '{}'::jsonb) INTO v_current_breakdown
    FROM players WHERE id = v_referrer_id;

    v_current_value := COALESCE((v_current_breakdown->>'Приглашение друга')::integer, 0);

    UPDATE players
    SET
        time_currency = COALESCE(time_currency, 0) + v_referrer_time,
        airdrop_points = COALESCE(airdrop_points, 0) + v_referrer_points,
        airdrop_breakdown = jsonb_set(
            v_current_breakdown,
            '{Приглашение друга}',
            to_jsonb(v_current_value + v_referrer_points)
        )
    WHERE id = v_referrer_id;

    -- Начисляем ПОЛНУЮ награду новому игроку + обновляем breakdown
    SELECT COALESCE(airdrop_breakdown, '{}'::jsonb) INTO v_current_breakdown
    FROM players WHERE id = v_referred_id;

    v_current_value := COALESCE((v_current_breakdown->>'Приглашение друга')::integer, 0);

    UPDATE players
    SET
        time_currency = COALESCE(time_currency, 0) + p_reward_time,
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

-- ============================================================
-- ЧАСТЬ 2: Исправляем существующие данные
-- Пересчитываем breakdown для всех рефереров на основе таблицы referrals
-- ============================================================

-- Для каждого реферера: подсчитываем сколько BMP он должен был получить
-- и обновляем breakdown
DO $$
DECLARE
    r RECORD;
    v_total_referral_points INTEGER;
    v_current_breakdown JSONB;
    v_current_total INTEGER;
    v_breakdown_sum INTEGER;
BEGIN
    -- Находим всех рефереров
    FOR r IN
        SELECT
            p.id as player_id,
            p.telegram_id,
            p.airdrop_points,
            p.airdrop_breakdown,
            COUNT(ref.id) as ref_count
        FROM players p
        INNER JOIN referrals ref ON ref.referrer_telegram_id = p.telegram_id
        GROUP BY p.id, p.telegram_id, p.airdrop_points, p.airdrop_breakdown
    LOOP
        -- Считаем сколько BPM реферер должен был получить (убывающая награда)
        -- Формула: SUM(200 * 0.9^i) для i = 0..count-1, минимум 25
        v_total_referral_points := 0;
        FOR i IN 0..r.ref_count-1 LOOP
            v_total_referral_points := v_total_referral_points + GREATEST(25, FLOOR(200 * POWER(0.9, i))::integer);
        END LOOP;

        v_current_breakdown := COALESCE(r.airdrop_breakdown, '{}'::jsonb);

        -- Обновляем breakdown: ставим правильное значение для "Приглашение друга"
        -- Сохраняем существующие 200 BMP (если игрок сам был приглашён) + реферальные
        -- Проверяем, был ли этот игрок сам приглашён
        IF EXISTS(SELECT 1 FROM referrals WHERE referred_telegram_id = r.telegram_id) THEN
            -- Игрок был приглашён сам (+200) И пригласил других
            v_total_referral_points := v_total_referral_points + 200;
        END IF;

        v_current_breakdown := jsonb_set(
            v_current_breakdown,
            '{Приглашение друга}',
            to_jsonb(v_total_referral_points)
        );

        -- Пересчитываем сумму breakdown
        SELECT COALESCE(SUM(value::text::integer), 0)
        INTO v_breakdown_sum
        FROM jsonb_each(v_current_breakdown);

        -- Если airdrop_points меньше суммы breakdown, увеличиваем
        -- (не уменьшаем airdrop_points никогда!)
        UPDATE players
        SET
            airdrop_breakdown = v_current_breakdown,
            airdrop_points = GREATEST(airdrop_points, v_breakdown_sum)
        WHERE id = r.player_id;

        RAISE NOTICE 'Fixed referrer % (telegram %): ref_count=%, referral_bpm=%, breakdown_sum=%',
            r.player_id, r.telegram_id, r.ref_count, v_total_referral_points, v_breakdown_sum;
    END LOOP;
END $$;
