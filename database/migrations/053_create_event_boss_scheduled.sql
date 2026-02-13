-- Migration 053: Allow scheduling event boss with a future start time
-- Adds p_starts_at parameter to create_event_boss so admin can create
-- the boss BEFORE the event starts. Players won't see it until starts_at.

-- Drop old function signature first (different param count)
DROP FUNCTION IF EXISTS create_event_boss(TEXT, BIGINT, JSONB, JSONB, INTEGER);

CREATE OR REPLACE FUNCTION create_event_boss(
    p_name TEXT,
    p_max_hp BIGINT,
    p_config JSONB,
    p_rewards JSONB,
    p_duration_hours INTEGER DEFAULT 168,        -- 7 days default
    p_starts_at TIMESTAMPTZ DEFAULT now()         -- schedule for future
)
RETURNS JSONB AS $$
DECLARE
    v_boss_id INTEGER;
    v_starts TIMESTAMPTZ;
    v_ends   TIMESTAMPTZ;
BEGIN
    v_starts := COALESCE(p_starts_at, now());
    v_ends   := v_starts + (p_duration_hours || ' hours')::INTERVAL;

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
        v_starts,
        v_ends
    )
    RETURNING id INTO v_boss_id;

    RETURN jsonb_build_object(
        'success', true,
        'boss_id', v_boss_id,
        'name', p_name,
        'max_hp', p_max_hp,
        'starts_at', v_starts,
        'ends_at', v_ends
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_event_boss(TEXT, BIGINT, JSONB, JSONB, INTEGER, TIMESTAMPTZ)
    IS 'Admin: create new event boss (supports scheduled start)';
