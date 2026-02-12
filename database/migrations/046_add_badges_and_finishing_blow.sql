-- Migration 046: Add badges system and finishing blow tracking
-- Badges are cosmetic marks shown next to player names (e.g. event boss top 3)

-- ============================================
-- STEP 1: Add badges column to players table
-- ============================================
ALTER TABLE players ADD COLUMN IF NOT EXISTS badges JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ============================================
-- STEP 2: Add finishing_blow_by to event_bosses
-- ============================================
ALTER TABLE event_bosses ADD COLUMN IF NOT EXISTS finishing_blow_by TEXT;

-- ============================================
-- STEP 3: Update event_boss_deal_damage to track finishing blow + return it
-- ============================================
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
    v_existing RECORD;
    v_player_total_damage BIGINT;
    v_player_attacks INTEGER;
BEGIN
    -- Validate damage
    IF p_damage <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid damage amount');
    END IF;

    -- Get player ID and username
    SELECT id, username INTO v_player_id, v_player_username
    FROM players WHERE telegram_id = p_telegram_id;
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
    v_is_finishing_blow := v_is_defeated; -- The player who reduces HP to 0 gets the finishing blow

    -- Update boss HP and stats (+ finishing_blow_by if defeated)
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

    -- Return result with finishing_blow flag
    RETURN jsonb_build_object(
        'success', true,
        'damage_dealt', p_damage,
        'boss_new_hp', v_new_hp,
        'boss_max_hp', v_boss.max_hp,
        'boss_defeated', v_is_defeated,
        'finishing_blow', v_is_finishing_blow,
        'player_total_damage', v_player_total_damage,
        'player_attacks', v_player_attacks
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 4: Update get_active_event_boss to return finishing_blow_by
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
            'finishing_blow_by', v_boss.finishing_blow_by,
            'total_participants', v_boss.total_participants,
            'total_damage_dealt', v_boss.total_damage_dealt
        );
    END IF;

    -- 2. Find recently ended boss (defeated/expired within last 7 days)
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
            'finishing_blow_by', v_boss.finishing_blow_by,
            'ends_at', v_boss.ends_at,
            'total_participants', v_boss.total_participants,
            'total_damage_dealt', v_boss.total_damage_dealt
        );
    END IF;

    RETURN jsonb_build_object('active', false);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- STEP 5: Update get_event_boss_leaderboard to include player badges
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
                'best_single_attack', ebd.best_single_attack,
                'badges', COALESCE(p.badges, '[]'::jsonb)
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
-- STEP 6: Update update_player_safe to handle badges
-- ============================================
CREATE OR REPLACE FUNCTION update_player_safe(p_telegram_id BIGINT, p_data JSONB)
RETURNS VOID AS $$
DECLARE
    current_points INTEGER;
    new_points INTEGER;
BEGIN
    -- Anti-cheat: airdrop_points can only increase
    SELECT airdrop_points INTO current_points FROM players WHERE telegram_id = p_telegram_id;
    new_points := COALESCE((p_data->>'airdrop_points')::INTEGER, current_points);

    IF new_points < current_points THEN
        RAISE NOTICE 'airdrop_points: attempt to decrease % -> %, keeping %', current_points, new_points, current_points;
        new_points := current_points;
    END IF;

    UPDATE players
    SET
        username = COALESCE(p_data->>'username', username),
        level = COALESCE((p_data->>'level')::INTEGER, level),
        rating = COALESCE((p_data->>'rating')::INTEGER, rating),
        wins = COALESCE((p_data->>'wins')::INTEGER, wins),
        losses = COALESCE((p_data->>'losses')::INTEGER, losses),
        total_battles = COALESCE((p_data->>'total_battles')::INTEGER, total_battles),
        faction = COALESCE(p_data->>'faction', faction),
        faction_changed = COALESCE((p_data->>'faction_changed')::BOOLEAN, faction_changed),
        wizards = CASE
            WHEN p_data ? 'wizards' AND p_data->'wizards' IS NOT NULL
            THEN p_data->'wizards'
            ELSE wizards
        END,
        spells = CASE
            WHEN p_data ? 'spells' AND p_data->'spells' IS NOT NULL
            THEN p_data->'spells'
            ELSE spells
        END,
        formation = CASE
            WHEN p_data ? 'formation' AND p_data->'formation' IS NOT NULL
            THEN p_data->'formation'
            ELSE formation
        END,
        buildings = CASE
            WHEN p_data ? 'buildings' AND p_data->'buildings' IS NOT NULL
            THEN p_data->'buildings'
            ELSE buildings
        END,
        time_currency_base = CASE
            WHEN p_data ? 'time_currency_base' AND p_data->>'time_currency_base' IS NOT NULL
            THEN (p_data->>'time_currency_base')::INTEGER
            ELSE time_currency_base
        END,
        time_currency_updated_at = CASE
            WHEN p_data ? 'time_currency_updated_at' AND p_data->>'time_currency_updated_at' IS NOT NULL
            THEN (p_data->>'time_currency_updated_at')::TIMESTAMPTZ
            ELSE time_currency_updated_at
        END,
        time_currency = CASE
            WHEN p_data ? 'time_currency_base' AND p_data->>'time_currency_base' IS NOT NULL
            THEN (p_data->>'time_currency_base')::INTEGER
            WHEN p_data ? 'time_currency' AND p_data->>'time_currency' IS NOT NULL
            THEN (p_data->>'time_currency')::INTEGER
            ELSE time_currency
        END,
        last_login = CASE
            WHEN p_data ? 'last_login' AND p_data->>'last_login' IS NOT NULL
            THEN (p_data->>'last_login')::TIMESTAMPTZ
            ELSE last_login
        END,
        purchased_packs = CASE
            WHEN p_data ? 'purchased_packs' AND p_data->'purchased_packs' IS NOT NULL
            THEN p_data->'purchased_packs'
            ELSE purchased_packs
        END,
        airdrop_points = new_points,
        airdrop_breakdown = CASE
            WHEN p_data ? 'airdrop_breakdown' AND p_data->'airdrop_breakdown' IS NOT NULL
            THEN p_data->'airdrop_breakdown'
            ELSE airdrop_breakdown
        END,
        wallet_address = COALESCE(p_data->>'wallet_address', wallet_address),
        wallet_connected_at = CASE
            WHEN p_data ? 'wallet_connected_at' AND p_data->'wallet_connected_at' IS NOT NULL
            THEN TO_TIMESTAMP((p_data->>'wallet_connected_at')::BIGINT / 1000.0)
            ELSE wallet_connected_at
        END,
        battle_energy = CASE
            WHEN p_data ? 'battle_energy' AND p_data->'battle_energy' IS NOT NULL
            THEN p_data->'battle_energy'
            ELSE battle_energy
        END,
        pve_progress = CASE
            WHEN p_data ? 'pve_progress' AND p_data->'pve_progress' IS NOT NULL
            THEN p_data->'pve_progress'
            ELSE pve_progress
        END,
        daily_login = CASE
            WHEN p_data ? 'daily_login' AND p_data->'daily_login' IS NOT NULL
            THEN p_data->'daily_login'
            ELSE daily_login
        END,
        current_season = COALESCE((p_data->>'current_season')::INTEGER, current_season),
        season_league_rewards_claimed = CASE
            WHEN p_data ? 'season_league_rewards_claimed' AND p_data->'season_league_rewards_claimed' IS NOT NULL
            THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'season_league_rewards_claimed'))
            ELSE season_league_rewards_claimed
        END,
        unlocked_skins = CASE
            WHEN p_data ? 'unlocked_skins' AND p_data->'unlocked_skins' IS NOT NULL
            THEN p_data->'unlocked_skins'
            ELSE unlocked_skins
        END,
        wizard_skins = CASE
            WHEN p_data ? 'wizard_skins' AND p_data->'wizard_skins' IS NOT NULL
            THEN p_data->'wizard_skins'
            ELSE wizard_skins
        END,
        training_dummy_progress = CASE
            WHEN p_data ? 'training_dummy_progress' AND p_data->'training_dummy_progress' IS NOT NULL
            THEN p_data->'training_dummy_progress'
            ELSE training_dummy_progress
        END,
        welcome_shown = COALESCE((p_data->>'welcome_shown')::BOOLEAN, welcome_shown),
        settings = CASE
            WHEN p_data ? 'settings' AND p_data->'settings' IS NOT NULL
            THEN p_data->'settings'
            ELSE settings
        END,
        completed_tasks = CASE
            WHEN p_data ? 'completed_tasks' AND p_data->'completed_tasks' IS NOT NULL
            THEN p_data->'completed_tasks'
            ELSE completed_tasks
        END,
        badges = CASE
            WHEN p_data ? 'badges' AND p_data->'badges' IS NOT NULL
            THEN p_data->'badges'
            ELSE badges
        END,
        guild_id = CASE
            WHEN p_data ? 'guild_id' AND p_data->>'guild_id' IS NOT NULL
            THEN (p_data->>'guild_id')::INTEGER
            ELSE guild_id
        END,
        guild_contribution = CASE
            WHEN p_data ? 'guild_contribution' AND p_data->>'guild_contribution' IS NOT NULL
            THEN (p_data->>'guild_contribution')::BIGINT
            ELSE guild_contribution
        END,
        guild_last_active = CASE
            WHEN p_data ? 'guild_last_active' AND p_data->>'guild_last_active' IS NOT NULL
            THEN (p_data->>'guild_last_active')::TIMESTAMPTZ
            ELSE guild_last_active
        END
    WHERE telegram_id = p_telegram_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
