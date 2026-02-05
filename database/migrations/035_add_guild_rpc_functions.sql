-- Migration 035: Add all guild RPC functions
-- Date: 2025-02-05
-- Description: Creates RPC functions for guild management with progressive XP multiplier after level 30

-- Constants for guild system
-- MAX_LEVEL = 30
-- CAPACITY_EXP_MULTIPLIER = 0.03 (3% per extra player)
-- RESEARCH_CYCLE_MULTIPLIER = 0.20 (20% increase per research point after level 30)
-- Base capacity = 10, +5 at levels 5,10,15,20,25,30

-- Helper function: Calculate guild capacity by level
CREATE OR REPLACE FUNCTION get_guild_capacity(p_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
    capacity INTEGER := 10;
    bonus_levels INTEGER[] := ARRAY[5, 10, 15, 20, 25, 30];
    lvl INTEGER;
BEGIN
    FOREACH lvl IN ARRAY bonus_levels LOOP
        IF p_level >= lvl THEN
            capacity := capacity + 5;
        END IF;
    END LOOP;
    RETURN capacity;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function: Calculate research cycles (points earned after level 30)
CREATE OR REPLACE FUNCTION get_research_cycles(p_research JSONB, p_bonus_points INTEGER, p_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total_spent INTEGER := 0;
    total_earned INTEGER;
    school TEXT;
BEGIN
    IF p_level < 30 THEN
        RETURN 0;
    END IF;

    -- Sum all spent research points
    FOR school IN SELECT jsonb_object_keys(p_research) LOOP
        total_spent := total_spent + COALESCE((p_research->>school)::INTEGER, 0);
    END LOOP;

    total_earned := total_spent + COALESCE(p_bonus_points, 0);

    -- Points from levels 1-30 = 30, rest are cycles after 30
    RETURN GREATEST(0, total_earned - 30);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function: Calculate XP needed for next level/research point
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
    -- After max level, use formula for level 31
    calc_level := LEAST(p_level + 1, 31);
    IF p_level > 30 THEN
        calc_level := 31;
    END IF;

    -- Base quadratic progression: (100 + level^2 * 50) * 6
    base_exp := (100 + (calc_level * calc_level * 50)) * 6;

    -- Capacity multiplier: +3% per extra player above base 10
    capacity := get_guild_capacity(LEAST(p_level, 30));
    extra_players := capacity - 10;
    capacity_multiplier := 1 + (extra_players * 0.03);

    -- Research multiplier after level 30: +20% per cycle
    research_multiplier := 1;
    IF p_level >= 30 AND p_research_cycles > 0 THEN
        research_multiplier := POWER(1.20, p_research_cycles);
    END IF;

    RETURN FLOOR(base_exp * capacity_multiplier * research_multiplier);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main RPC: Add experience to guild
CREATE OR REPLACE FUNCTION guild_add_experience(
    p_guild_id INTEGER,
    p_telegram_id BIGINT,
    p_exp_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_player_id INTEGER;
    v_guild RECORD;
    v_exp_to_next BIGINT;
    v_new_experience BIGINT;
    v_new_level INTEGER;
    v_new_bonus_points INTEGER;
    v_leveled_up BOOLEAN := FALSE;
    v_research_cycles INTEGER;
    v_new_contribution BIGINT;
BEGIN
    -- Check player exists and is in this guild
    SELECT id, guild_id, guild_contribution INTO v_player_id, v_guild.id, v_new_contribution
    FROM players
    WHERE telegram_id = p_telegram_id;

    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found');
    END IF;

    IF v_guild.id IS NULL OR v_guild.id != p_guild_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not in this guild');
    END IF;

    -- Get guild data
    SELECT * INTO v_guild FROM guilds WHERE id = p_guild_id;

    IF v_guild IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Guild not found');
    END IF;

    -- Calculate research cycles for multiplier
    v_research_cycles := get_research_cycles(v_guild.research, v_guild.bonus_points, v_guild.level);

    -- Calculate XP needed
    v_exp_to_next := get_exp_to_next_level(v_guild.level, v_research_cycles);

    -- Add experience
    v_new_experience := v_guild.experience + p_exp_amount;
    v_new_level := v_guild.level;
    v_new_bonus_points := v_guild.bonus_points;

    -- Check for level up (or research point gain after 30)
    WHILE v_new_experience >= v_exp_to_next LOOP
        v_new_experience := v_new_experience - v_exp_to_next;

        IF v_new_level < 30 THEN
            v_new_level := v_new_level + 1;
        END IF;

        v_new_bonus_points := v_new_bonus_points + 1;
        v_leveled_up := TRUE;

        -- Recalculate research cycles and XP needed for next
        v_research_cycles := get_research_cycles(v_guild.research, v_new_bonus_points, v_new_level);
        v_exp_to_next := get_exp_to_next_level(v_new_level, v_research_cycles);
    END LOOP;

    -- Update guild
    UPDATE guilds
    SET experience = v_new_experience,
        level = v_new_level,
        bonus_points = v_new_bonus_points
    WHERE id = p_guild_id;

    -- Update player contribution
    v_new_contribution := COALESCE(v_new_contribution, 0) + p_exp_amount;
    UPDATE players
    SET guild_contribution = v_new_contribution,
        guild_last_active = NOW()
    WHERE telegram_id = p_telegram_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_experience', v_new_experience,
        'new_level', v_new_level,
        'new_bonus_points', v_new_bonus_points,
        'new_contribution', v_new_contribution,
        'leveled_up', v_leveled_up
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Update guild settings (leader only)
CREATE OR REPLACE FUNCTION update_guild_by_leader(
    p_guild_id INTEGER,
    p_telegram_id BIGINT,
    p_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_player_id INTEGER;
    v_leader_id INTEGER;
BEGIN
    -- Get player id
    SELECT id INTO v_player_id FROM players WHERE telegram_id = p_telegram_id;

    IF v_player_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if player is leader
    SELECT leader_id INTO v_leader_id FROM guilds WHERE id = p_guild_id;

    IF v_leader_id IS NULL OR v_leader_id != v_player_id THEN
        RETURN FALSE;
    END IF;

    -- Update allowed fields
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

-- RPC: Join guild or send request
CREATE OR REPLACE FUNCTION guild_join_request(
    p_guild_id INTEGER,
    p_telegram_id BIGINT,
    p_username TEXT,
    p_action TEXT  -- 'join' or 'request'
)
RETURNS JSONB AS $$
DECLARE
    v_player_id INTEGER;
    v_guild RECORD;
    v_member_count INTEGER;
    v_capacity INTEGER;
    v_requests JSONB;
BEGIN
    -- Get player
    SELECT id, guild_id INTO v_player_id, v_guild.id
    FROM players WHERE telegram_id = p_telegram_id;

    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found');
    END IF;

    IF v_guild.id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already in a guild');
    END IF;

    -- Get guild
    SELECT * INTO v_guild FROM guilds WHERE id = p_guild_id;

    IF v_guild IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Guild not found');
    END IF;

    -- Check capacity
    SELECT COUNT(*) INTO v_member_count FROM players WHERE guild_id = p_guild_id;
    v_capacity := get_guild_capacity(v_guild.level);

    IF v_member_count >= v_capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Guild is full');
    END IF;

    IF p_action = 'request' THEN
        -- Add to join requests
        v_requests := COALESCE(v_guild.join_requests, '[]'::jsonb);
        v_requests := v_requests || jsonb_build_object(
            'player_id', v_player_id,
            'username', p_username,
            'date', NOW()
        );

        UPDATE guilds SET join_requests = v_requests WHERE id = p_guild_id;

        RETURN jsonb_build_object('success', true, 'action', 'request');
    ELSE
        -- Direct join
        UPDATE players
        SET guild_id = p_guild_id,
            guild_contribution = 0,
            guild_last_active = NOW()
        WHERE telegram_id = p_telegram_id;

        RETURN jsonb_build_object('success', true, 'action', 'join');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Kick member (leader only)
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
    -- Get leader player id
    SELECT id INTO v_leader_player_id FROM players WHERE telegram_id = p_leader_telegram_id;

    -- Check if caller is leader
    SELECT leader_id INTO v_guild_leader_id FROM guilds WHERE id = p_guild_id;

    IF v_guild_leader_id IS NULL OR v_guild_leader_id != v_leader_player_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only leader can kick members');
    END IF;

    -- Cannot kick self
    IF p_target_player_id = v_leader_player_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot kick yourself');
    END IF;

    -- Remove from guild
    UPDATE players
    SET guild_id = NULL,
        guild_contribution = 0,
        guild_last_active = NULL
    WHERE id = p_target_player_id AND guild_id = p_guild_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Handle join request (leader only)
CREATE OR REPLACE FUNCTION guild_handle_request(
    p_guild_id INTEGER,
    p_leader_telegram_id BIGINT,
    p_target_player_id INTEGER,
    p_approve BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_leader_player_id INTEGER;
    v_guild_leader_id INTEGER;
    v_requests JSONB;
    v_member_count INTEGER;
    v_capacity INTEGER;
    v_level INTEGER;
BEGIN
    -- Get leader player id
    SELECT id INTO v_leader_player_id FROM players WHERE telegram_id = p_leader_telegram_id;

    -- Check if caller is leader
    SELECT leader_id, join_requests, level INTO v_guild_leader_id, v_requests, v_level
    FROM guilds WHERE id = p_guild_id;

    IF v_guild_leader_id IS NULL OR v_guild_leader_id != v_leader_player_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only leader can handle requests');
    END IF;

    -- Remove from requests
    v_requests := (
        SELECT COALESCE(jsonb_agg(req), '[]'::jsonb)
        FROM jsonb_array_elements(COALESCE(v_requests, '[]'::jsonb)) req
        WHERE (req->>'player_id')::INTEGER != p_target_player_id
    );

    UPDATE guilds SET join_requests = v_requests WHERE id = p_guild_id;

    IF p_approve THEN
        -- Check capacity before approving
        SELECT COUNT(*) INTO v_member_count FROM players WHERE guild_id = p_guild_id;
        v_capacity := get_guild_capacity(v_level);

        IF v_member_count >= v_capacity THEN
            RETURN jsonb_build_object('success', false, 'error', 'Guild is full');
        END IF;

        -- Add player to guild
        UPDATE players
        SET guild_id = p_guild_id,
            guild_contribution = 0,
            guild_last_active = NOW()
        WHERE id = p_target_player_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'approved', p_approve);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Delete guild (leader only, when empty or last member leaving)
CREATE OR REPLACE FUNCTION guild_delete(
    p_guild_id INTEGER,
    p_leader_telegram_id BIGINT
)
RETURNS JSONB AS $$
DECLARE
    v_leader_player_id INTEGER;
    v_guild_leader_id INTEGER;
    v_member_count INTEGER;
BEGIN
    -- Get leader player id
    SELECT id INTO v_leader_player_id FROM players WHERE telegram_id = p_leader_telegram_id;

    -- Check if caller is leader
    SELECT leader_id INTO v_guild_leader_id FROM guilds WHERE id = p_guild_id;

    IF v_guild_leader_id IS NULL OR v_guild_leader_id != v_leader_player_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only leader can delete guild');
    END IF;

    -- Check if guild is empty (except leader)
    SELECT COUNT(*) INTO v_member_count FROM players WHERE guild_id = p_guild_id;

    IF v_member_count > 1 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Guild has members. Transfer leadership first.');
    END IF;

    -- Remove leader from guild
    UPDATE players
    SET guild_id = NULL,
        guild_contribution = 0,
        guild_last_active = NULL
    WHERE guild_id = p_guild_id;

    -- Delete guild
    DELETE FROM guilds WHERE id = p_guild_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION get_guild_capacity(integer) IS 'Calculate guild member capacity based on level';
COMMENT ON FUNCTION get_research_cycles(jsonb, integer, integer) IS 'Calculate research cycles completed after level 30';
COMMENT ON FUNCTION get_exp_to_next_level(integer, integer) IS 'Calculate XP needed for next level with research multiplier';
COMMENT ON FUNCTION guild_add_experience(integer, bigint, integer) IS 'Add experience to guild with progressive multiplier after level 30';
COMMENT ON FUNCTION update_guild_by_leader(integer, bigint, jsonb) IS 'Update guild settings (leader only)';
COMMENT ON FUNCTION guild_join_request(integer, bigint, text, text) IS 'Join guild or send join request';
COMMENT ON FUNCTION guild_kick_member(integer, bigint, integer) IS 'Kick member from guild (leader only)';
COMMENT ON FUNCTION guild_handle_request(integer, bigint, integer, boolean) IS 'Approve or decline join request (leader only)';
COMMENT ON FUNCTION guild_delete(integer, bigint) IS 'Delete guild (leader only, must be empty)';
