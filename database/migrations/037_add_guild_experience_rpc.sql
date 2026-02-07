-- Migration 037: Add guild_add_experience RPC function
-- Fixes: Guild not leveling up despite having enough experience
-- Problem: The guild_add_experience function was missing or had incorrect level-up logic

-- Configuration constants matching guild-manager.js
-- MAX_LEVEL: 30
-- Base formula: (100 + level^2 * 50) * 6
-- Capacity bonus: +3% per extra player slot above base 10
-- Capacity increases at levels 5, 10, 15, 20, 25, 30 (+5 each)

-- Helper function to calculate guild capacity by level
CREATE OR REPLACE FUNCTION get_guild_capacity(p_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
    capacity INTEGER := 10; -- BASE_CAPACITY
    bonus_levels INTEGER[] := ARRAY[5, 10, 15, 20, 25, 30];
    bonus_level INTEGER;
BEGIN
    FOREACH bonus_level IN ARRAY bonus_levels
    LOOP
        IF p_level >= bonus_level THEN
            capacity := capacity + 5; -- CAPACITY_BONUS
        END IF;
    END LOOP;
    RETURN capacity;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to calculate experience required for next level
CREATE OR REPLACE FUNCTION get_exp_to_next_level(p_level INTEGER, p_research_cycles INTEGER DEFAULT 0)
RETURNS BIGINT AS $$
DECLARE
    calc_level INTEGER;
    base_exp BIGINT;
    capacity INTEGER;
    extra_players INTEGER;
    capacity_multiplier NUMERIC;
    research_multiplier NUMERIC;
BEGIN
    -- After max level, use formula as for level 31
    IF p_level > 30 THEN
        calc_level := 31;
    ELSE
        calc_level := p_level;
    END IF;

    -- Base quadratic progression: (100 + level^2 * 50) * 6
    base_exp := (100 + (calc_level * calc_level * 50)) * 6;

    -- Capacity multiplier: +3% per extra player above base 10
    capacity := get_guild_capacity(LEAST(p_level, 30));
    extra_players := capacity - 10;
    capacity_multiplier := 1.0 + (extra_players * 0.03);

    -- Research multiplier for post-30 level: +20% per cycle
    research_multiplier := 1.0;
    IF p_level >= 30 AND p_research_cycles > 0 THEN
        research_multiplier := POWER(1.20, p_research_cycles);
    END IF;

    RETURN FLOOR(base_exp * capacity_multiplier * research_multiplier);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main function to add guild experience with level-up logic
CREATE OR REPLACE FUNCTION guild_add_experience(
    p_guild_id INTEGER,
    p_telegram_id BIGINT,
    p_exp_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_player_id INTEGER;
    v_guild RECORD;
    v_old_level INTEGER;
    v_new_level INTEGER;
    v_new_experience BIGINT;
    v_new_bonus_points INTEGER;
    v_exp_required BIGINT;
    v_leveled_up BOOLEAN := FALSE;
    v_research_cycles INTEGER := 0;
    v_total_spent_points INTEGER;
    v_total_earned_points INTEGER;
    v_new_contribution BIGINT;
BEGIN
    -- Get player ID
    SELECT id INTO v_player_id FROM players WHERE telegram_id = p_telegram_id;

    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found');
    END IF;

    -- Get guild data
    SELECT * INTO v_guild FROM guilds WHERE id = p_guild_id;

    IF v_guild IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Guild not found');
    END IF;

    -- Initialize variables
    v_old_level := v_guild.level;
    v_new_level := v_guild.level;
    v_new_experience := v_guild.experience + p_exp_amount;
    v_new_bonus_points := v_guild.bonus_points;

    -- Calculate research cycles for post-30 level guilds
    IF v_new_level >= 30 THEN
        v_total_spent_points := COALESCE((
            SELECT SUM(value::integer)
            FROM jsonb_each_text(v_guild.research)
        ), 0);
        v_total_earned_points := v_total_spent_points + v_new_bonus_points;
        v_research_cycles := GREATEST(0, v_total_earned_points - 30);
    END IF;

    -- Level up loop - keep leveling while experience is sufficient
    LOOP
        -- Check if already at max level
        IF v_new_level >= 30 THEN
            -- At max level, only give bonus points, no level increase
            v_exp_required := get_exp_to_next_level(v_new_level, v_research_cycles);

            IF v_new_experience >= v_exp_required THEN
                v_new_experience := v_new_experience - v_exp_required;
                v_new_bonus_points := v_new_bonus_points + 1;
                v_leveled_up := TRUE;
                -- Update research cycles for next iteration
                v_research_cycles := v_research_cycles + 1;
            ELSE
                EXIT; -- Not enough experience for next bonus point
            END IF;
        ELSE
            -- Normal level up
            v_exp_required := get_exp_to_next_level(v_new_level, 0);

            IF v_new_experience >= v_exp_required THEN
                v_new_experience := v_new_experience - v_exp_required;
                v_new_level := v_new_level + 1;
                v_new_bonus_points := v_new_bonus_points + 1;
                v_leveled_up := TRUE;
            ELSE
                EXIT; -- Not enough experience for next level
            END IF;
        END IF;
    END LOOP;

    -- Update guild in database
    UPDATE guilds
    SET
        experience = v_new_experience,
        level = v_new_level,
        bonus_points = v_new_bonus_points
    WHERE id = p_guild_id;

    -- Update player's contribution and last active
    UPDATE players
    SET
        guild_contribution = COALESCE(guild_contribution, 0) + p_exp_amount,
        guild_last_active = NOW()
    WHERE telegram_id = p_telegram_id
    RETURNING guild_contribution INTO v_new_contribution;

    -- Return result
    RETURN jsonb_build_object(
        'success', true,
        'new_experience', v_new_experience,
        'new_level', v_new_level,
        'new_bonus_points', v_new_bonus_points,
        'new_contribution', v_new_contribution,
        'leveled_up', v_leveled_up,
        'levels_gained', v_new_level - v_old_level
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION guild_add_experience(integer, bigint, integer) IS 'Add experience to guild with automatic level-up. Returns new state and whether level increased.';

-- Also add update_guild_by_leader function if missing
CREATE OR REPLACE FUNCTION update_guild_by_leader(
    p_guild_id INTEGER,
    p_telegram_id BIGINT,
    p_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_player_id INTEGER;
    v_guild_leader_id INTEGER;
BEGIN
    -- Get player ID
    SELECT id INTO v_player_id FROM players WHERE telegram_id = p_telegram_id;

    IF v_player_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Get guild leader ID
    SELECT leader_id INTO v_guild_leader_id FROM guilds WHERE id = p_guild_id;

    -- Check if player is leader
    IF v_player_id != v_guild_leader_id THEN
        RETURN FALSE;
    END IF;

    -- Update guild
    UPDATE guilds
    SET
        leader_id = COALESCE((p_data->>'leader_id')::INTEGER, leader_id),
        join_mode = COALESCE(p_data->>'join_mode', join_mode),
        research = CASE
            WHEN p_data ? 'research' AND p_data->'research' IS NOT NULL
            THEN p_data->'research'
            ELSE research
        END,
        bonus_points = COALESCE((p_data->>'bonus_points')::INTEGER, bonus_points)
    WHERE id = p_guild_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_guild_by_leader(integer, bigint, jsonb) IS 'Update guild settings - only leader can call this.';

-- Add guild_join_request function
CREATE OR REPLACE FUNCTION guild_join_request(
    p_guild_id INTEGER,
    p_telegram_id BIGINT,
    p_username TEXT,
    p_action TEXT -- 'join' or 'request'
)
RETURNS JSONB AS $$
DECLARE
    v_player_id INTEGER;
    v_guild RECORD;
    v_current_count INTEGER;
    v_capacity INTEGER;
BEGIN
    -- Get player ID
    SELECT id INTO v_player_id FROM players WHERE telegram_id = p_telegram_id;

    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found');
    END IF;

    -- Get guild
    SELECT * INTO v_guild FROM guilds WHERE id = p_guild_id;

    IF v_guild IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Guild not found');
    END IF;

    -- Check capacity
    SELECT COUNT(*) INTO v_current_count FROM players WHERE guild_id = p_guild_id;
    v_capacity := get_guild_capacity(v_guild.level);

    IF v_current_count >= v_capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Guild is full');
    END IF;

    IF p_action = 'request' THEN
        -- Add to join requests
        UPDATE guilds
        SET join_requests = join_requests || jsonb_build_array(jsonb_build_object(
            'player_id', v_player_id,
            'username', p_username,
            'date', NOW()
        ))
        WHERE id = p_guild_id;

        RETURN jsonb_build_object('success', true, 'action', 'request');
    ELSE
        -- Direct join
        UPDATE players
        SET
            guild_id = p_guild_id,
            guild_contribution = 0,
            guild_last_active = NOW()
        WHERE telegram_id = p_telegram_id;

        RETURN jsonb_build_object('success', true, 'action', 'join');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add guild_kick_member function
CREATE OR REPLACE FUNCTION guild_kick_member(
    p_guild_id INTEGER,
    p_leader_telegram_id BIGINT,
    p_target_player_id INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_leader_player_id INTEGER;
    v_guild_leader_id INTEGER;
BEGIN
    -- Get leader's player ID
    SELECT id INTO v_leader_player_id FROM players WHERE telegram_id = p_leader_telegram_id;

    IF v_leader_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Leader not found');
    END IF;

    -- Get guild leader ID
    SELECT leader_id INTO v_guild_leader_id FROM guilds WHERE id = p_guild_id;

    -- Check if caller is leader
    IF v_leader_player_id != v_guild_leader_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only leader can kick members');
    END IF;

    -- Cannot kick yourself
    IF v_leader_player_id = p_target_player_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot kick yourself');
    END IF;

    -- Remove player from guild
    UPDATE players
    SET
        guild_id = NULL,
        guild_contribution = 0,
        guild_last_active = NULL
    WHERE id = p_target_player_id AND guild_id = p_guild_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add guild_handle_request function
CREATE OR REPLACE FUNCTION guild_handle_request(
    p_guild_id INTEGER,
    p_leader_telegram_id BIGINT,
    p_target_player_id INTEGER,
    p_approve BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_leader_player_id INTEGER;
    v_guild RECORD;
    v_current_count INTEGER;
    v_capacity INTEGER;
BEGIN
    -- Get leader's player ID
    SELECT id INTO v_leader_player_id FROM players WHERE telegram_id = p_leader_telegram_id;

    IF v_leader_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Leader not found');
    END IF;

    -- Get guild
    SELECT * INTO v_guild FROM guilds WHERE id = p_guild_id;

    -- Check if caller is leader
    IF v_leader_player_id != v_guild.leader_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only leader can handle requests');
    END IF;

    -- Remove from join_requests
    UPDATE guilds
    SET join_requests = (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(join_requests) elem
        WHERE (elem->>'player_id')::INTEGER != p_target_player_id
    )
    WHERE id = p_guild_id;

    IF p_approve THEN
        -- Check capacity before approving
        SELECT COUNT(*) INTO v_current_count FROM players WHERE guild_id = p_guild_id;
        v_capacity := get_guild_capacity(v_guild.level);

        IF v_current_count >= v_capacity THEN
            RETURN jsonb_build_object('success', false, 'error', 'Guild is full');
        END IF;

        -- Add player to guild
        UPDATE players
        SET
            guild_id = p_guild_id,
            guild_contribution = 0,
            guild_last_active = NOW()
        WHERE id = p_target_player_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'approved', p_approve);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add guild_delete function
CREATE OR REPLACE FUNCTION guild_delete(
    p_guild_id INTEGER,
    p_leader_telegram_id BIGINT
)
RETURNS JSONB AS $$
DECLARE
    v_leader_player_id INTEGER;
    v_guild_leader_id INTEGER;
BEGIN
    -- Get leader's player ID
    SELECT id INTO v_leader_player_id FROM players WHERE telegram_id = p_leader_telegram_id;

    IF v_leader_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Leader not found');
    END IF;

    -- Get guild leader ID
    SELECT leader_id INTO v_guild_leader_id FROM guilds WHERE id = p_guild_id;

    -- Check if caller is leader
    IF v_leader_player_id != v_guild_leader_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only leader can delete guild');
    END IF;

    -- Remove all members from guild first
    UPDATE players
    SET
        guild_id = NULL,
        guild_contribution = 0,
        guild_last_active = NULL
    WHERE guild_id = p_guild_id;

    -- Delete guild
    DELETE FROM guilds WHERE id = p_guild_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION guild_delete(integer, bigint) IS 'Delete guild - only leader can do this.';
