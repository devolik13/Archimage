-- Migration 045: Restore all RPC functions missing from migration 043
-- Migration 043 restored columns, tables and core functions but MISSED:
-- 1. ALL guild management RPCs (migration 037) - CRITICAL, guild system broken
-- 2. leave_guild (migration 028) - CRITICAL, can't leave guilds
-- 3. Trial system RPCs (migrations 029, 030) - used with fallback
-- 4. get_server_time (migration 027) - used with fallback
-- 5. get_current_week_year (trial_system) - dependency for trial functions
--
-- Also fixes: trial reward functions now use time_currency_base (lazy accrual)

-- ============================================
-- PART 0: Drop old function overloads to prevent ambiguity
-- (old migrations may have created these with different param types)
-- ============================================
DROP FUNCTION IF EXISTS guild_handle_request(integer, bigint, bigint, boolean);
DROP FUNCTION IF EXISTS guild_handle_request(integer, bigint, integer, boolean);
DROP FUNCTION IF EXISTS guild_kick_member(integer, bigint, bigint);
DROP FUNCTION IF EXISTS guild_kick_member(integer, bigint, integer);
DROP FUNCTION IF EXISTS guild_join_request(integer, bigint, text, text);
DROP FUNCTION IF EXISTS guild_add_experience(integer, bigint, integer);
DROP FUNCTION IF EXISTS guild_add_experience(integer, bigint, bigint);
DROP FUNCTION IF EXISTS update_guild_by_leader(integer, bigint, jsonb);
DROP FUNCTION IF EXISTS guild_delete(integer, bigint);
DROP FUNCTION IF EXISTS leave_guild(bigint);
DROP FUNCTION IF EXISTS get_guild_capacity(integer);
DROP FUNCTION IF EXISTS get_exp_to_next_level(integer, integer);

-- ============================================
-- PART 1: get_server_time (migration 027)
-- ============================================

CREATE OR REPLACE FUNCTION get_server_time()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT now();
$$;

-- ============================================
-- PART 2: Guild system RPCs (migrations 028, 037)
-- ============================================

-- Helper: guild capacity by level
CREATE OR REPLACE FUNCTION get_guild_capacity(p_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
    capacity INTEGER := 10;
    bonus_levels INTEGER[] := ARRAY[5, 10, 15, 20, 25, 30];
    bonus_level INTEGER;
BEGIN
    FOREACH bonus_level IN ARRAY bonus_levels
    LOOP
        IF p_level >= bonus_level THEN
            capacity := capacity + 5;
        END IF;
    END LOOP;
    RETURN capacity;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper: exp required for next level
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
    IF p_level > 30 THEN
        calc_level := 31;
    ELSE
        calc_level := p_level;
    END IF;

    base_exp := (100 + (calc_level * calc_level * 50)) * 6;

    capacity := get_guild_capacity(LEAST(p_level, 30));
    extra_players := capacity - 10;
    capacity_multiplier := 1.0 + (extra_players * 0.03);

    research_multiplier := 1.0;
    IF p_level >= 30 AND p_research_cycles > 0 THEN
        research_multiplier := POWER(1.20, p_research_cycles);
    END IF;

    RETURN FLOOR(base_exp * capacity_multiplier * research_multiplier);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add experience to guild with level-up logic
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
    SELECT id INTO v_player_id FROM players WHERE telegram_id = p_telegram_id;
    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found');
    END IF;

    SELECT * INTO v_guild FROM guilds WHERE id = p_guild_id;
    IF v_guild IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Guild not found');
    END IF;

    v_old_level := v_guild.level;
    v_new_level := v_guild.level;
    v_new_experience := v_guild.experience + p_exp_amount;
    v_new_bonus_points := v_guild.bonus_points;

    IF v_new_level >= 30 THEN
        v_total_spent_points := COALESCE((
            SELECT SUM(value::integer)
            FROM jsonb_each_text(v_guild.research)
        ), 0);
        v_total_earned_points := v_total_spent_points + v_new_bonus_points;
        v_research_cycles := GREATEST(0, v_total_earned_points - 30);
    END IF;

    LOOP
        IF v_new_level >= 30 THEN
            v_exp_required := get_exp_to_next_level(v_new_level, v_research_cycles);
            IF v_new_experience >= v_exp_required THEN
                v_new_experience := v_new_experience - v_exp_required;
                v_new_bonus_points := v_new_bonus_points + 1;
                v_leveled_up := TRUE;
                v_research_cycles := v_research_cycles + 1;
            ELSE
                EXIT;
            END IF;
        ELSE
            v_exp_required := get_exp_to_next_level(v_new_level, 0);
            IF v_new_experience >= v_exp_required THEN
                v_new_experience := v_new_experience - v_exp_required;
                v_new_level := v_new_level + 1;
                v_new_bonus_points := v_new_bonus_points + 1;
                v_leveled_up := TRUE;
            ELSE
                EXIT;
            END IF;
        END IF;
    END LOOP;

    UPDATE guilds
    SET experience = v_new_experience, level = v_new_level, bonus_points = v_new_bonus_points
    WHERE id = p_guild_id;

    UPDATE players
    SET guild_contribution = COALESCE(guild_contribution, 0) + p_exp_amount, guild_last_active = NOW()
    WHERE telegram_id = p_telegram_id
    RETURNING guild_contribution INTO v_new_contribution;

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

-- Update guild by leader
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
    SELECT id INTO v_player_id FROM players WHERE telegram_id = p_telegram_id;
    IF v_player_id IS NULL THEN RETURN FALSE; END IF;

    SELECT leader_id INTO v_guild_leader_id FROM guilds WHERE id = p_guild_id;
    IF v_player_id != v_guild_leader_id THEN RETURN FALSE; END IF;

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

-- Join guild (direct or request)
CREATE OR REPLACE FUNCTION guild_join_request(
    p_guild_id INTEGER,
    p_telegram_id BIGINT,
    p_username TEXT,
    p_action TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_player_id INTEGER;
    v_guild RECORD;
    v_current_count INTEGER;
    v_capacity INTEGER;
BEGIN
    SELECT id INTO v_player_id FROM players WHERE telegram_id = p_telegram_id;
    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found');
    END IF;

    SELECT * INTO v_guild FROM guilds WHERE id = p_guild_id;
    IF v_guild IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Guild not found');
    END IF;

    SELECT COUNT(*) INTO v_current_count FROM players WHERE guild_id = p_guild_id;
    v_capacity := get_guild_capacity(v_guild.level);

    IF v_current_count >= v_capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Guild is full');
    END IF;

    IF p_action = 'request' THEN
        UPDATE guilds
        SET join_requests = join_requests || jsonb_build_array(jsonb_build_object(
            'player_id', v_player_id,
            'username', p_username,
            'date', NOW()
        ))
        WHERE id = p_guild_id;
        RETURN jsonb_build_object('success', true, 'action', 'request');
    ELSE
        UPDATE players
        SET guild_id = p_guild_id, guild_contribution = 0, guild_last_active = NOW()
        WHERE telegram_id = p_telegram_id;
        RETURN jsonb_build_object('success', true, 'action', 'join');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kick member from guild
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
    SELECT id INTO v_leader_player_id FROM players WHERE telegram_id = p_leader_telegram_id;
    IF v_leader_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Leader not found');
    END IF;

    SELECT leader_id INTO v_guild_leader_id FROM guilds WHERE id = p_guild_id;
    IF v_leader_player_id != v_guild_leader_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only leader can kick members');
    END IF;

    IF v_leader_player_id = p_target_player_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot kick yourself');
    END IF;

    UPDATE players
    SET guild_id = NULL, guild_contribution = 0, guild_last_active = NULL
    WHERE id = p_target_player_id AND guild_id = p_guild_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle join request (approve/reject)
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
    SELECT id INTO v_leader_player_id FROM players WHERE telegram_id = p_leader_telegram_id;
    IF v_leader_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Leader not found');
    END IF;

    SELECT * INTO v_guild FROM guilds WHERE id = p_guild_id;
    IF v_leader_player_id != v_guild.leader_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only leader can handle requests');
    END IF;

    UPDATE guilds
    SET join_requests = (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(join_requests) elem
        WHERE (elem->>'player_id')::INTEGER != p_target_player_id
    )
    WHERE id = p_guild_id;

    IF p_approve THEN
        SELECT COUNT(*) INTO v_current_count FROM players WHERE guild_id = p_guild_id;
        v_capacity := get_guild_capacity(v_guild.level);

        IF v_current_count >= v_capacity THEN
            RETURN jsonb_build_object('success', false, 'error', 'Guild is full');
        END IF;

        UPDATE players
        SET guild_id = p_guild_id, guild_contribution = 0, guild_last_active = NOW()
        WHERE id = p_target_player_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'approved', p_approve);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete guild
CREATE OR REPLACE FUNCTION guild_delete(
    p_guild_id INTEGER,
    p_leader_telegram_id BIGINT
)
RETURNS JSONB AS $$
DECLARE
    v_leader_player_id INTEGER;
    v_guild_leader_id INTEGER;
BEGIN
    SELECT id INTO v_leader_player_id FROM players WHERE telegram_id = p_leader_telegram_id;
    IF v_leader_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Leader not found');
    END IF;

    SELECT leader_id INTO v_guild_leader_id FROM guilds WHERE id = p_guild_id;
    IF v_leader_player_id != v_guild_leader_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only leader can delete guild');
    END IF;

    UPDATE players
    SET guild_id = NULL, guild_contribution = 0, guild_last_active = NULL
    WHERE guild_id = p_guild_id;

    DELETE FROM guilds WHERE id = p_guild_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leave guild
CREATE OR REPLACE FUNCTION leave_guild(p_telegram_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_player_id INTEGER;
    v_guild_id INTEGER;
BEGIN
    SELECT id, guild_id INTO v_player_id, v_guild_id
    FROM players
    WHERE telegram_id = p_telegram_id;

    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found');
    END IF;

    IF v_guild_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not in a guild');
    END IF;

    UPDATE players
    SET guild_id = NULL, guild_contribution = 0, guild_last_active = NULL
    WHERE telegram_id = p_telegram_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 3: Trial system RPCs (migrations 029, 030)
-- Fixed: use time_currency_base instead of time_currency
-- ============================================

-- Helper: current week year
CREATE OR REPLACE FUNCTION get_current_week_year()
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT to_char(now(), 'IYYY-IW');
$$;

-- Drop old function signatures first (return types may differ)
DROP FUNCTION IF EXISTS auto_claim_trial_reward(bigint, text);
DROP FUNCTION IF EXISTS claim_trial_reward(uuid, bigint);
DROP FUNCTION IF EXISTS upsert_trial_result(bigint, text, int);
DROP FUNCTION IF EXISTS get_player_week_result(bigint, text);
DROP FUNCTION IF EXISTS get_player_trial_rank(bigint);
DROP FUNCTION IF EXISTS get_unclaimed_trial_rewards(bigint);

-- Auto claim trial reward (FIXED: uses time_currency_base)
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
    v_internal_player_id INTEGER;
    v_current_balance INTEGER;
    v_new_base INTEGER;
BEGIN
    SELECT id INTO v_internal_player_id
    FROM players WHERE telegram_id = p_player_id;

    IF v_internal_player_id IS NULL THEN
        RETURN QUERY SELECT false::boolean, 0::bigint, 0::bigint, 0::float, 0::int, 0::int, 'Player not found'::text;
        RETURN;
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM trial_rewards
        WHERE player_id = v_internal_player_id AND week_year = p_week_year
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
        RETURN QUERY SELECT false::boolean, 0::bigint, 0::bigint, 0::float, 0::int, 0::int, 'Already claimed'::text;
        RETURN;
    END IF;

    SELECT * INTO v_result FROM get_player_week_result(v_internal_player_id, p_week_year);

    IF v_result IS NULL OR v_result.rank IS NULL THEN
        RETURN QUERY SELECT false::boolean, 0::bigint, 0::bigint, 0::float, 0::int, 0::int, 'No results for this week'::text;
        RETURN;
    END IF;

    -- FIXED: use time_currency_base with lazy accrual
    v_current_balance := get_time_currency(p_player_id);
    v_new_base := LEAST(v_current_balance + v_result.reward_time, 999999);

    UPDATE players
    SET time_currency_base = v_new_base,
        time_currency_updated_at = now(),
        time_currency = v_new_base
    WHERE telegram_id = p_player_id;

    INSERT INTO trial_rewards (player_id, week_year, rank_position, rank_percent, reward_tier, reward_time, claimed, claimed_at)
    VALUES (
        v_internal_player_id, p_week_year, v_result.rank, v_result.percent,
        CASE
            WHEN v_result.percent <= 1 THEN 'legendary'
            WHEN v_result.percent <= 5 THEN 'epic'
            WHEN v_result.percent <= 10 THEN 'rare'
            WHEN v_result.percent <= 25 THEN 'uncommon'
            WHEN v_result.percent <= 50 THEN 'common'
            ELSE 'participation'
        END,
        v_result.reward_time, true, now()
    );

    RETURN QUERY SELECT true::boolean, v_result.rank, v_result.total_players, v_result.percent,
        v_result.best_damage, v_result.reward_time, 'Reward claimed!'::text;
END;
$$;

-- Claim trial reward (FIXED: uses time_currency_base)
CREATE OR REPLACE FUNCTION claim_trial_reward(p_reward_id uuid, p_player_id bigint)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reward_time int;
    v_internal_player_id INTEGER;
    v_current_balance INTEGER;
    v_new_base INTEGER;
BEGIN
    SELECT id INTO v_internal_player_id FROM players WHERE telegram_id = p_player_id;
    IF v_internal_player_id IS NULL THEN RETURN 0; END IF;

    UPDATE trial_rewards
    SET claimed = true, claimed_at = now()
    WHERE id = p_reward_id AND player_id = v_internal_player_id AND claimed = false
    RETURNING reward_time INTO v_reward_time;

    IF v_reward_time IS NULL THEN RETURN 0; END IF;

    -- FIXED: use time_currency_base
    v_current_balance := get_time_currency(p_player_id);
    v_new_base := LEAST(v_current_balance + v_reward_time, 999999);

    UPDATE players
    SET time_currency_base = v_new_base,
        time_currency_updated_at = now(),
        time_currency = v_new_base
    WHERE telegram_id = p_player_id;

    RETURN v_reward_time;
END;
$$;

-- Upsert trial result
CREATE OR REPLACE FUNCTION upsert_trial_result(
    p_player_id bigint,
    p_player_name text,
    p_damage int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_week_year text;
    v_internal_player_id INTEGER;
BEGIN
    v_week_year := get_current_week_year();

    SELECT id INTO v_internal_player_id FROM players WHERE telegram_id = p_player_id;
    IF v_internal_player_id IS NULL THEN RETURN; END IF;

    INSERT INTO trial_leaderboard (player_id, player_name, week_year, best_damage, total_damage, attempts_count)
    VALUES (v_internal_player_id, p_player_name, v_week_year, p_damage, p_damage, 1)
    ON CONFLICT (player_id, week_year) DO UPDATE SET
        best_damage = GREATEST(trial_leaderboard.best_damage, EXCLUDED.best_damage),
        total_damage = trial_leaderboard.total_damage + p_damage,
        attempts_count = trial_leaderboard.attempts_count + 1,
        updated_at = now();

    UPDATE players
    SET trial_best_damage = GREATEST(COALESCE(trial_best_damage, 0), p_damage)
    WHERE telegram_id = p_player_id;
END;
$$;

-- Get player week result (with 10000 min participants from migration 030)
CREATE OR REPLACE FUNCTION get_player_week_result(p_player_id bigint, p_week_year text)
RETURNS TABLE (
    rank bigint,
    total_players bigint,
    percent float,
    best_damage int,
    reward_time int
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_internal_player_id INTEGER;
    v_min_participants CONSTANT INTEGER := 10000;
BEGIN
    IF p_player_id > 1000000 THEN
        SELECT id INTO v_internal_player_id FROM players WHERE telegram_id = p_player_id;
    ELSE
        v_internal_player_id := p_player_id;
    END IF;

    RETURN QUERY
    WITH ranked AS (
        SELECT
            tl.player_id,
            tl.best_damage,
            ROW_NUMBER() OVER (ORDER BY tl.total_damage DESC) as rk,
            COUNT(*) OVER () as total
        FROM trial_leaderboard tl
        WHERE tl.week_year = p_week_year
    )
    SELECT
        r.rk,
        r.total as total_players,
        (r.rk::float / r.total * 100) as percent,
        r.best_damage,
        CASE
            WHEN r.total >= v_min_participants THEN
                CASE
                    WHEN (r.rk::float / r.total * 100) <= 1 THEN 10080
                    WHEN (r.rk::float / r.total * 100) <= 5 THEN 4320
                    WHEN (r.rk::float / r.total * 100) <= 10 THEN 2880
                    WHEN (r.rk::float / r.total * 100) <= 25 THEN 1440
                    WHEN (r.rk::float / r.total * 100) <= 50 THEN 720
                    ELSE 180
                END
            ELSE 0
        END as reward_time
    FROM ranked r
    WHERE r.player_id = v_internal_player_id;
END;
$$;

-- Get player trial rank
CREATE OR REPLACE FUNCTION get_player_trial_rank(p_player_id bigint)
RETURNS TABLE (
    rank bigint,
    total_players bigint,
    percent float
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_internal_player_id INTEGER;
BEGIN
    IF p_player_id > 1000000 THEN
        SELECT id INTO v_internal_player_id FROM players WHERE telegram_id = p_player_id;
    ELSE
        v_internal_player_id := p_player_id;
    END IF;

    RETURN QUERY
    WITH ranked AS (
        SELECT
            tl.player_id,
            ROW_NUMBER() OVER (ORDER BY total_damage DESC) as rk,
            COUNT(*) OVER () as total
        FROM trial_leaderboard tl
        WHERE week_year = get_current_week_year()
    )
    SELECT r.rk, r.total as total_players, (r.rk::float / r.total * 100) as percent
    FROM ranked r
    WHERE r.player_id = v_internal_player_id;
END;
$$;

-- Get unclaimed trial rewards
CREATE OR REPLACE FUNCTION get_unclaimed_trial_rewards(p_player_id bigint)
RETURNS TABLE (
    id uuid,
    week_year text,
    rank_position int,
    rank_percent float,
    reward_tier text,
    reward_time int
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_internal_player_id INTEGER;
BEGIN
    IF p_player_id > 1000000 THEN
        SELECT players.id INTO v_internal_player_id FROM players WHERE players.telegram_id = p_player_id;
    ELSE
        v_internal_player_id := p_player_id;
    END IF;

    RETURN QUERY
    SELECT tr.id, tr.week_year, tr.rank_position, tr.rank_percent, tr.reward_tier, tr.reward_time
    FROM trial_rewards tr
    WHERE tr.player_id = v_internal_player_id AND tr.claimed = false
    ORDER BY tr.created_at DESC;
END;
$$;

-- Get trial leaderboard (from trial_system.sql, was never in numbered migrations)
CREATE OR REPLACE FUNCTION get_trial_leaderboard(p_limit int DEFAULT 100)
RETURNS TABLE (
    rank bigint,
    player_id bigint,
    player_name text,
    best_damage int,
    total_damage int,
    attempts_count int
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        ROW_NUMBER() OVER (ORDER BY total_damage DESC) as rank,
        player_id,
        player_name,
        best_damage,
        total_damage,
        attempts_count
    FROM trial_leaderboard
    WHERE week_year = get_current_week_year()
    ORDER BY total_damage DESC
    LIMIT p_limit;
$$;
