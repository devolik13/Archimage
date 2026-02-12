-- Migration 050: Move boss attempts from localStorage to database
-- Server-side attempt tracking: prevents cheating, enables admin control.
-- Max 10 free attempts per day, resets daily. Extra attempts purchasable.

-- ============================================
-- STEP 1: Add attempts columns to event_boss_damage
-- ============================================
ALTER TABLE event_boss_damage
    ADD COLUMN IF NOT EXISTS daily_used INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS daily_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS purchased INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- STEP 2: RPC to get player's remaining attempts
-- ============================================
CREATE OR REPLACE FUNCTION get_event_boss_attempts(
    p_boss_id INTEGER,
    p_telegram_id BIGINT
)
RETURNS JSONB AS $$
DECLARE
    v_max_daily INTEGER := 10;
    v_rec RECORD;
    v_remaining INTEGER;
BEGIN
    SELECT daily_used, daily_date, purchased
    INTO v_rec
    FROM event_boss_damage
    WHERE boss_id = p_boss_id AND telegram_id = p_telegram_id;

    -- No row yet = never attacked = full attempts
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'remaining', v_max_daily,
            'used', 0,
            'purchased', 0,
            'max_daily', v_max_daily
        );
    END IF;

    -- New day → reset
    IF v_rec.daily_date != CURRENT_DATE THEN
        UPDATE event_boss_damage
        SET daily_used = 0, daily_date = CURRENT_DATE, purchased = 0
        WHERE boss_id = p_boss_id AND telegram_id = p_telegram_id;

        RETURN jsonb_build_object(
            'remaining', v_max_daily,
            'used', 0,
            'purchased', 0,
            'max_daily', v_max_daily
        );
    END IF;

    v_remaining := GREATEST(0, v_max_daily + v_rec.purchased - v_rec.daily_used);

    RETURN jsonb_build_object(
        'remaining', v_remaining,
        'used', v_rec.daily_used,
        'purchased', v_rec.purchased,
        'max_daily', v_max_daily
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: RPC to purchase an extra attempt
-- ============================================
CREATE OR REPLACE FUNCTION purchase_event_boss_attempt(
    p_boss_id INTEGER,
    p_telegram_id BIGINT
)
RETURNS JSONB AS $$
DECLARE
    v_player_id INTEGER;
    v_max_daily INTEGER := 10;
    v_daily_used INTEGER;
    v_purchased INTEGER;
    v_remaining INTEGER;
BEGIN
    SELECT id INTO v_player_id FROM players WHERE telegram_id = p_telegram_id;
    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found');
    END IF;

    -- Ensure row exists
    INSERT INTO event_boss_damage (boss_id, player_id, telegram_id, total_damage, attacks_count, best_single_attack, daily_used, daily_date, purchased)
    VALUES (p_boss_id, v_player_id, p_telegram_id, 0, 0, 0, 0, CURRENT_DATE, 0)
    ON CONFLICT (boss_id, player_id) DO NOTHING;

    -- Reset if new day, then increment purchased
    UPDATE event_boss_damage
    SET
        daily_used = CASE WHEN daily_date != CURRENT_DATE THEN 0 ELSE daily_used END,
        purchased = CASE WHEN daily_date != CURRENT_DATE THEN 1 ELSE purchased + 1 END,
        daily_date = CURRENT_DATE
    WHERE boss_id = p_boss_id AND player_id = v_player_id
    RETURNING daily_used, purchased INTO v_daily_used, v_purchased;

    v_remaining := GREATEST(0, v_max_daily + v_purchased - v_daily_used);

    RETURN jsonb_build_object(
        'success', true,
        'remaining', v_remaining,
        'used', v_daily_used,
        'purchased', v_purchased,
        'max_daily', v_max_daily
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: Update event_boss_deal_damage — check & consume attempts server-side
-- ============================================
CREATE OR REPLACE FUNCTION event_boss_deal_damage(
    p_boss_id INTEGER,
    p_telegram_id BIGINT,
    p_damage BIGINT,
    p_rating_damage BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_player_id INTEGER;
    v_player_username TEXT;
    v_boss RECORD;
    v_new_hp BIGINT;
    v_is_defeated BOOLEAN := FALSE;
    v_is_finishing_blow BOOLEAN := FALSE;
    v_player_total_damage BIGINT;
    v_player_attacks INTEGER;
    v_rd BIGINT;
    v_max_daily INTEGER := 10;
    v_attempts RECORD;
    v_remaining INTEGER;
BEGIN
    v_rd := COALESCE(p_rating_damage, p_damage);

    IF p_damage <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid damage amount');
    END IF;

    -- Get player
    SELECT id, username INTO v_player_id, v_player_username
    FROM players WHERE telegram_id = p_telegram_id;
    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found');
    END IF;

    -- Get boss with lock
    SELECT * INTO v_boss
    FROM event_bosses WHERE id = p_boss_id FOR UPDATE;

    IF v_boss IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boss not found');
    END IF;

    IF v_boss.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boss is not active', 'status', v_boss.status);
    END IF;

    IF v_boss.ends_at <= now() THEN
        UPDATE event_bosses SET status = 'expired' WHERE id = p_boss_id;
        RETURN jsonb_build_object('success', false, 'error', 'Event has ended');
    END IF;

    IF v_boss.current_hp <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boss already defeated');
    END IF;

    -- Ensure player damage row exists
    INSERT INTO event_boss_damage (boss_id, player_id, telegram_id, total_damage, attacks_count, best_single_attack, daily_used, daily_date, purchased)
    VALUES (p_boss_id, v_player_id, p_telegram_id, 0, 0, 0, 0, CURRENT_DATE, 0)
    ON CONFLICT (boss_id, player_id) DO NOTHING;

    -- Lock player row and check attempts
    SELECT daily_used, daily_date, purchased
    INTO v_attempts
    FROM event_boss_damage
    WHERE boss_id = p_boss_id AND player_id = v_player_id
    FOR UPDATE;

    -- Reset if new day
    IF v_attempts.daily_date != CURRENT_DATE THEN
        v_attempts.daily_used := 0;
        v_attempts.purchased := 0;
    END IF;

    -- Check attempts
    IF v_attempts.daily_used >= v_max_daily + v_attempts.purchased THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No attempts remaining',
            'attempts_remaining', 0
        );
    END IF;

    -- Calculate new HP
    v_new_hp := GREATEST(0, v_boss.current_hp - p_damage);
    v_is_defeated := (v_new_hp = 0);
    v_is_finishing_blow := v_is_defeated;

    -- Update boss
    UPDATE event_bosses
    SET
        current_hp = v_new_hp,
        total_damage_dealt = total_damage_dealt + p_damage,
        status = CASE WHEN v_new_hp = 0 THEN 'defeated' ELSE status END,
        defeated_at = CASE WHEN v_new_hp = 0 THEN now() ELSE defeated_at END,
        finishing_blow_by = CASE WHEN v_new_hp = 0 THEN v_player_username ELSE finishing_blow_by END,
        total_participants = (
            SELECT COUNT(DISTINCT player_id)
            FROM event_boss_damage
            WHERE boss_id = p_boss_id
        ) + CASE
            WHEN NOT EXISTS (SELECT 1 FROM event_boss_damage WHERE boss_id = p_boss_id AND player_id = v_player_id AND total_damage > 0)
            THEN 1
            ELSE 0
        END
    WHERE id = p_boss_id;

    -- Update player damage + consume attempt
    UPDATE event_boss_damage
    SET
        total_damage = total_damage + v_rd,
        attacks_count = attacks_count + 1,
        best_single_attack = GREATEST(best_single_attack, v_rd),
        last_attack_at = now(),
        daily_used = v_attempts.daily_used + 1,
        daily_date = CURRENT_DATE,
        purchased = v_attempts.purchased
    WHERE boss_id = p_boss_id AND player_id = v_player_id;

    -- Get updated stats
    SELECT total_damage, attacks_count INTO v_player_total_damage, v_player_attacks
    FROM event_boss_damage
    WHERE boss_id = p_boss_id AND player_id = v_player_id;

    v_remaining := GREATEST(0, v_max_daily + v_attempts.purchased - (v_attempts.daily_used + 1));

    RETURN jsonb_build_object(
        'success', true,
        'damage_dealt', v_rd,
        'boss_new_hp', v_new_hp,
        'boss_max_hp', v_boss.max_hp,
        'boss_defeated', v_is_defeated,
        'finishing_blow', v_is_finishing_blow,
        'player_total_damage', v_player_total_damage,
        'player_attacks', v_player_attacks,
        'attempts_remaining', v_remaining
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
