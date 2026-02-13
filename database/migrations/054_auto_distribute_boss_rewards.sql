-- Migration 054: Auto-distribute event boss rewards via trigger
-- When boss status changes to 'defeated', automatically distribute rewards
-- to all participants, top damagers, and finishing blow player.

-- ============================================
-- STEP 1: Add rewards_distributed flag + finishing_blow_telegram_id
-- ============================================
ALTER TABLE event_bosses ADD COLUMN IF NOT EXISTS rewards_distributed BOOLEAN DEFAULT FALSE;
ALTER TABLE event_bosses ADD COLUMN IF NOT EXISTS finishing_blow_telegram_id BIGINT;

-- Drop old signatures with extra parameters
DROP FUNCTION IF EXISTS event_boss_deal_damage(INTEGER, BIGINT, BIGINT, BIGINT);

-- Simplified: only p_damage (no rating_damage), includes attempt tracking from 050
CREATE OR REPLACE FUNCTION event_boss_deal_damage(
    p_boss_id INTEGER,
    p_telegram_id BIGINT,
    p_damage BIGINT
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
    v_max_daily INTEGER := 10;
    v_attempts RECORD;
    v_remaining INTEGER;
BEGIN
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

    -- Update boss HP and stats (trigger will handle rewards on status='defeated')
    UPDATE event_bosses
    SET
        current_hp = v_new_hp,
        total_damage_dealt = total_damage_dealt + p_damage,
        status = CASE WHEN v_new_hp = 0 THEN 'defeated' ELSE status END,
        defeated_at = CASE WHEN v_new_hp = 0 THEN now() ELSE defeated_at END,
        finishing_blow_by = CASE WHEN v_new_hp = 0 THEN v_player_username ELSE finishing_blow_by END,
        finishing_blow_telegram_id = CASE WHEN v_new_hp = 0 THEN p_telegram_id ELSE finishing_blow_telegram_id END,
        total_participants = (
            SELECT COUNT(DISTINCT player_id)
            FROM event_boss_damage
            WHERE boss_id = p_boss_id
            AND total_damage > 0
        ) + CASE
            WHEN NOT EXISTS (SELECT 1 FROM event_boss_damage WHERE boss_id = p_boss_id AND player_id = v_player_id AND total_damage > 0)
            THEN 1
            ELSE 0
        END
    WHERE id = p_boss_id;

    -- Update player damage + consume attempt
    UPDATE event_boss_damage
    SET
        total_damage = total_damage + p_damage,
        attacks_count = attacks_count + 1,
        best_single_attack = GREATEST(best_single_attack, p_damage),
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
        'damage_dealt', p_damage,
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

-- ============================================
-- STEP 2: Reward distribution function
-- ============================================
CREATE OR REPLACE FUNCTION distribute_event_boss_rewards(p_boss_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_boss RECORD;
    v_rewards JSONB;
    v_participant RECORD;
    v_top RECORD;
    v_rank INTEGER;
    v_participation_reward INTEGER;
    v_boss_killed_reward INTEGER;
    v_top_rewards INTEGER[];
    v_finishing_blow_reward INTEGER;
    v_total_distributed INTEGER := 0;
    v_participants_count INTEGER := 0;
BEGIN
    -- Get boss with lock
    SELECT * INTO v_boss
    FROM event_bosses
    WHERE id = p_boss_id
    FOR UPDATE;

    IF v_boss IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boss not found');
    END IF;

    IF v_boss.status != 'defeated' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boss is not defeated', 'status', v_boss.status);
    END IF;

    IF v_boss.rewards_distributed THEN
        RETURN jsonb_build_object('success', false, 'error', 'Rewards already distributed');
    END IF;

    v_rewards := v_boss.rewards;

    -- Parse reward amounts (in minutes of time currency)
    v_participation_reward := COALESCE((v_rewards->'participation'->>'timeCurrency')::INTEGER, 0);
    v_boss_killed_reward := COALESCE((v_rewards->'bossKilled'->>'timeCurrency')::INTEGER, 0);
    v_finishing_blow_reward := COALESCE((v_rewards->'finishingBlow'->>'timeCurrency')::INTEGER, 0);
    v_top_rewards := ARRAY[
        COALESCE((v_rewards->'top1'->>'timeCurrency')::INTEGER, 0),
        COALESCE((v_rewards->'top2'->>'timeCurrency')::INTEGER, 0),
        COALESCE((v_rewards->'top3'->>'timeCurrency')::INTEGER, 0)
    ];

    -- 1. Distribute participation + bossKilled to ALL participants
    FOR v_participant IN
        SELECT telegram_id FROM event_boss_damage WHERE boss_id = p_boss_id
    LOOP
        IF v_participation_reward + v_boss_killed_reward > 0 THEN
            PERFORM add_time_currency(v_participant.telegram_id, v_participation_reward + v_boss_killed_reward);
            v_total_distributed := v_total_distributed + v_participation_reward + v_boss_killed_reward;
            v_participants_count := v_participants_count + 1;
        END IF;
    END LOOP;

    -- 2. Distribute top1/top2/top3 rewards by damage ranking
    v_rank := 0;
    FOR v_top IN
        SELECT telegram_id, total_damage
        FROM event_boss_damage
        WHERE boss_id = p_boss_id
        ORDER BY total_damage DESC
        LIMIT 3
    LOOP
        v_rank := v_rank + 1;
        IF v_top_rewards[v_rank] > 0 THEN
            PERFORM add_time_currency(v_top.telegram_id, v_top_rewards[v_rank]);
            v_total_distributed := v_total_distributed + v_top_rewards[v_rank];
        END IF;
    END LOOP;

    -- 3. Distribute finishing blow reward
    IF v_finishing_blow_reward > 0 AND v_boss.finishing_blow_telegram_id IS NOT NULL THEN
        PERFORM add_time_currency(v_boss.finishing_blow_telegram_id, v_finishing_blow_reward);
        v_total_distributed := v_total_distributed + v_finishing_blow_reward;
    END IF;

    -- Mark rewards as distributed
    UPDATE event_bosses
    SET rewards_distributed = TRUE
    WHERE id = p_boss_id;

    RETURN jsonb_build_object(
        'success', true,
        'boss_id', p_boss_id,
        'participants_rewarded', v_participants_count,
        'total_minutes_distributed', v_total_distributed,
        'participation_per_player', v_participation_reward + v_boss_killed_reward,
        'top1_bonus', v_top_rewards[1],
        'top2_bonus', v_top_rewards[2],
        'top3_bonus', v_top_rewards[3],
        'finishing_blow_bonus', v_finishing_blow_reward
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Trigger - auto-distribute on boss defeat
-- ============================================
CREATE OR REPLACE FUNCTION trigger_boss_defeated_rewards()
RETURNS TRIGGER AS $$
BEGIN
    -- Only fire when status changes to 'defeated'
    IF NEW.status = 'defeated' AND (OLD.status IS NULL OR OLD.status != 'defeated') THEN
        -- Distribute rewards (the function checks rewards_distributed flag internally)
        PERFORM distribute_event_boss_rewards(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_boss_defeated_rewards ON event_bosses;

-- Create trigger: fires AFTER status update to 'defeated'
CREATE TRIGGER trg_boss_defeated_rewards
    AFTER UPDATE OF status ON event_bosses
    FOR EACH ROW
    WHEN (NEW.status = 'defeated' AND OLD.status != 'defeated')
    EXECUTE FUNCTION trigger_boss_defeated_rewards();

COMMENT ON FUNCTION distribute_event_boss_rewards(INTEGER) IS 'Distribute all rewards to event boss participants (can also be called manually)';
COMMENT ON FUNCTION trigger_boss_defeated_rewards() IS 'Trigger: auto-distribute rewards when boss is defeated';
