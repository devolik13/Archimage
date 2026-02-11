-- Migration 042: Event Boss System
-- A global boss that ALL players on the server fight together.
-- Players attack the boss in individual battles, and damage is accumulated
-- from all players. The boss has a shared HP pool and a time limit (e.g. 5 days).

-- ============================================
-- TABLE: event_bosses - Active/past event bosses
-- ============================================
CREATE TABLE IF NOT EXISTS event_bosses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    -- Boss HP
    max_hp BIGINT NOT NULL,
    current_hp BIGINT NOT NULL,
    -- Boss configuration (spells, resistances, faction, etc.)
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Rewards configuration
    rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Timing
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at TIMESTAMPTZ NOT NULL,
    -- Status: 'active', 'defeated', 'expired'
    status TEXT NOT NULL DEFAULT 'active',
    defeated_at TIMESTAMPTZ,
    -- Stats
    total_participants INTEGER NOT NULL DEFAULT 0,
    total_damage_dealt BIGINT NOT NULL DEFAULT 0,
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookup of active boss
CREATE INDEX IF NOT EXISTS idx_event_bosses_status ON event_bosses(status);
CREATE INDEX IF NOT EXISTS idx_event_bosses_active ON event_bosses(status, starts_at, ends_at);

-- ============================================
-- TABLE: event_boss_damage - Per-player damage tracking
-- ============================================
CREATE TABLE IF NOT EXISTS event_boss_damage (
    id SERIAL PRIMARY KEY,
    boss_id INTEGER NOT NULL REFERENCES event_bosses(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    -- Accumulated stats
    total_damage BIGINT NOT NULL DEFAULT 0,
    attacks_count INTEGER NOT NULL DEFAULT 0,
    best_single_attack BIGINT NOT NULL DEFAULT 0,
    -- Timestamps
    first_attack_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_attack_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Unique constraint: one row per player per boss
    UNIQUE(boss_id, player_id)
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_event_boss_damage_leaderboard ON event_boss_damage(boss_id, total_damage DESC);
CREATE INDEX IF NOT EXISTS idx_event_boss_damage_player ON event_boss_damage(telegram_id, boss_id);

-- ============================================
-- RPC: get_active_event_boss - Get current or recently ended event boss
-- Returns active boss OR recently defeated/expired boss (for time modifier)
-- ============================================
CREATE OR REPLACE FUNCTION get_active_event_boss()
RETURNS JSONB AS $$
DECLARE
    v_boss RECORD;
BEGIN
    -- 1. Find active boss
    SELECT * INTO v_boss
    FROM event_bosses
    WHERE status = 'active'
      AND starts_at <= now()
      AND ends_at > now()
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_boss IS NOT NULL THEN
        RETURN jsonb_build_object(
            'active', true,
            'id', v_boss.id,
            'name', v_boss.name,
            'max_hp', v_boss.max_hp,
            'current_hp', v_boss.current_hp,
            'config', v_boss.config,
            'rewards', v_boss.rewards,
            'starts_at', v_boss.starts_at,
            'ends_at', v_boss.ends_at,
            'status', v_boss.status,
            'defeated_at', v_boss.defeated_at,
            'total_participants', v_boss.total_participants,
            'total_damage_dealt', v_boss.total_damage_dealt
        );
    END IF;

    -- 2. Find recently ended boss (defeated/expired within last 7 days)
    -- Needed for post-event time modifier (+30% or -50%)
    SELECT * INTO v_boss
    FROM event_bosses
    WHERE status IN ('defeated', 'expired')
      AND COALESCE(defeated_at, ends_at) > now() - INTERVAL '7 days'
    ORDER BY COALESCE(defeated_at, ends_at) DESC
    LIMIT 1;

    IF v_boss IS NOT NULL THEN
        RETURN jsonb_build_object(
            'active', false,
            'has_modifier', true,
            'id', v_boss.id,
            'name', v_boss.name,
            'max_hp', v_boss.max_hp,
            'current_hp', v_boss.current_hp,
            'status', v_boss.status,
            'defeated_at', v_boss.defeated_at,
            'ends_at', v_boss.ends_at,
            'total_participants', v_boss.total_participants,
            'total_damage_dealt', v_boss.total_damage_dealt
        );
    END IF;

    RETURN jsonb_build_object('active', false);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- RPC: event_boss_deal_damage - Record damage from a player's battle
-- Atomically reduces boss HP and updates player damage stats
-- ============================================
CREATE OR REPLACE FUNCTION event_boss_deal_damage(
    p_boss_id INTEGER,
    p_telegram_id BIGINT,
    p_damage BIGINT
)
RETURNS JSONB AS $$
DECLARE
    v_player_id INTEGER;
    v_boss RECORD;
    v_new_hp BIGINT;
    v_is_defeated BOOLEAN := FALSE;
    v_existing RECORD;
    v_player_total_damage BIGINT;
    v_player_attacks INTEGER;
BEGIN
    -- Validate damage
    IF p_damage <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid damage amount');
    END IF;

    -- Get player ID
    SELECT id INTO v_player_id FROM players WHERE telegram_id = p_telegram_id;
    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found');
    END IF;

    -- Get boss with row lock to prevent race conditions
    SELECT * INTO v_boss
    FROM event_bosses
    WHERE id = p_boss_id
    FOR UPDATE;

    IF v_boss IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boss not found');
    END IF;

    -- Check boss is still active
    IF v_boss.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boss is not active', 'status', v_boss.status);
    END IF;

    -- Check boss hasn't expired
    IF v_boss.ends_at <= now() THEN
        -- Mark as expired
        UPDATE event_bosses SET status = 'expired' WHERE id = p_boss_id;
        RETURN jsonb_build_object('success', false, 'error', 'Event has ended');
    END IF;

    -- Check boss still has HP
    IF v_boss.current_hp <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boss already defeated');
    END IF;

    -- Calculate new HP (cannot go below 0)
    v_new_hp := GREATEST(0, v_boss.current_hp - p_damage);
    v_is_defeated := (v_new_hp = 0);

    -- Update boss HP and stats
    UPDATE event_bosses
    SET
        current_hp = v_new_hp,
        total_damage_dealt = total_damage_dealt + p_damage,
        status = CASE WHEN v_new_hp = 0 THEN 'defeated' ELSE status END,
        defeated_at = CASE WHEN v_new_hp = 0 THEN now() ELSE defeated_at END,
        total_participants = (
            SELECT COUNT(DISTINCT player_id)
            FROM event_boss_damage
            WHERE boss_id = p_boss_id
        ) + CASE
            WHEN NOT EXISTS (SELECT 1 FROM event_boss_damage WHERE boss_id = p_boss_id AND player_id = v_player_id)
            THEN 1
            ELSE 0
        END
    WHERE id = p_boss_id;

    -- Upsert player damage record
    INSERT INTO event_boss_damage (boss_id, player_id, telegram_id, total_damage, attacks_count, best_single_attack)
    VALUES (p_boss_id, v_player_id, p_telegram_id, p_damage, 1, p_damage)
    ON CONFLICT (boss_id, player_id)
    DO UPDATE SET
        total_damage = event_boss_damage.total_damage + p_damage,
        attacks_count = event_boss_damage.attacks_count + 1,
        best_single_attack = GREATEST(event_boss_damage.best_single_attack, p_damage),
        last_attack_at = now();

    -- Get updated player stats
    SELECT total_damage, attacks_count INTO v_player_total_damage, v_player_attacks
    FROM event_boss_damage
    WHERE boss_id = p_boss_id AND player_id = v_player_id;

    -- Return result
    RETURN jsonb_build_object(
        'success', true,
        'damage_dealt', p_damage,
        'boss_new_hp', v_new_hp,
        'boss_max_hp', v_boss.max_hp,
        'boss_defeated', v_is_defeated,
        'player_total_damage', v_player_total_damage,
        'player_attacks', v_player_attacks
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RPC: get_event_boss_leaderboard - Get top damage dealers
-- ============================================
CREATE OR REPLACE FUNCTION get_event_boss_leaderboard(
    p_boss_id INTEGER,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(row_data ORDER BY rn)
    INTO v_result
    FROM (
        SELECT
            jsonb_build_object(
                'rank', ROW_NUMBER() OVER (ORDER BY ebd.total_damage DESC),
                'username', p.username,
                'telegram_id', ebd.telegram_id,
                'total_damage', ebd.total_damage,
                'attacks_count', ebd.attacks_count,
                'best_single_attack', ebd.best_single_attack
            ) AS row_data,
            ROW_NUMBER() OVER (ORDER BY ebd.total_damage DESC) AS rn
        FROM event_boss_damage ebd
        JOIN players p ON p.id = ebd.player_id
        WHERE ebd.boss_id = p_boss_id
        ORDER BY ebd.total_damage DESC
        LIMIT p_limit
    ) sub;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- RPC: get_player_event_boss_stats - Get player's own stats for a boss
-- ============================================
CREATE OR REPLACE FUNCTION get_player_event_boss_stats(
    p_boss_id INTEGER,
    p_telegram_id BIGINT
)
RETURNS JSONB AS $$
DECLARE
    v_stats RECORD;
    v_rank INTEGER;
BEGIN
    -- Get player stats
    SELECT * INTO v_stats
    FROM event_boss_damage
    WHERE boss_id = p_boss_id AND telegram_id = p_telegram_id;

    IF v_stats IS NULL THEN
        RETURN jsonb_build_object(
            'participated', false,
            'total_damage', 0,
            'attacks_count', 0,
            'rank', null
        );
    END IF;

    -- Calculate rank
    SELECT COUNT(*) + 1 INTO v_rank
    FROM event_boss_damage
    WHERE boss_id = p_boss_id AND total_damage > v_stats.total_damage;

    RETURN jsonb_build_object(
        'participated', true,
        'total_damage', v_stats.total_damage,
        'attacks_count', v_stats.attacks_count,
        'best_single_attack', v_stats.best_single_attack,
        'rank', v_rank,
        'first_attack_at', v_stats.first_attack_at,
        'last_attack_at', v_stats.last_attack_at
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- RPC: create_event_boss - Admin function to create a new event boss
-- ============================================
CREATE OR REPLACE FUNCTION create_event_boss(
    p_name TEXT,
    p_max_hp BIGINT,
    p_config JSONB,
    p_rewards JSONB,
    p_duration_hours INTEGER DEFAULT 120 -- 5 days default
)
RETURNS JSONB AS $$
DECLARE
    v_boss_id INTEGER;
BEGIN
    -- Deactivate any currently active boss
    UPDATE event_bosses
    SET status = 'expired'
    WHERE status = 'active';

    -- Create new boss
    INSERT INTO event_bosses (name, max_hp, current_hp, config, rewards, starts_at, ends_at)
    VALUES (
        p_name,
        p_max_hp,
        p_max_hp,
        p_config,
        p_rewards,
        now(),
        now() + (p_duration_hours || ' hours')::INTERVAL
    )
    RETURNING id INTO v_boss_id;

    RETURN jsonb_build_object(
        'success', true,
        'boss_id', v_boss_id,
        'name', p_name,
        'max_hp', p_max_hp,
        'ends_at', now() + (p_duration_hours || ' hours')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE event_bosses IS 'Global event bosses that all players fight together';
COMMENT ON TABLE event_boss_damage IS 'Per-player damage tracking for event bosses';
COMMENT ON FUNCTION get_active_event_boss() IS 'Get currently active event boss';
COMMENT ON FUNCTION event_boss_deal_damage(integer, bigint, bigint) IS 'Record damage dealt by player to event boss';
COMMENT ON FUNCTION get_event_boss_leaderboard(integer, integer) IS 'Get top damage dealers for event boss';
COMMENT ON FUNCTION get_player_event_boss_stats(integer, bigint) IS 'Get player stats for event boss';
COMMENT ON FUNCTION create_event_boss(text, bigint, jsonb, jsonb, integer) IS 'Admin: create new event boss';
