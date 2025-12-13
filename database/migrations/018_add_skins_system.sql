-- Migration 018: Add Skins System
-- Adds skin unlock tracking for wizards

-- Add skin fields to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS unlocked_skins JSONB DEFAULT '[]';
ALTER TABLE players ADD COLUMN IF NOT EXISTS wizard_skins JSONB DEFAULT '{}';

-- Update RPC function to include skin fields
CREATE OR REPLACE FUNCTION update_player_safe(p_telegram_id BIGINT, p_data JSONB)
RETURNS VOID AS $$
DECLARE
    current_points INTEGER;
    new_points INTEGER;
BEGIN
    -- Anti-cheat: airdrop_points могут только расти
    SELECT airdrop_points INTO current_points FROM players WHERE telegram_id = p_telegram_id;
    new_points := COALESCE((p_data->>'airdrop_points')::INTEGER, current_points);

    IF new_points < current_points THEN
        RAISE EXCEPTION 'Попытка уменьшить airdrop_points: % -> %', current_points, new_points;
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
        time_currency = COALESCE((p_data->>'time_currency')::INTEGER, time_currency),
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
        -- Season fields
        current_season = COALESCE((p_data->>'current_season')::INTEGER, current_season),
        season_league_rewards_claimed = CASE
            WHEN p_data ? 'season_league_rewards_claimed' AND p_data->'season_league_rewards_claimed' IS NOT NULL
            THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'season_league_rewards_claimed'))
            ELSE season_league_rewards_claimed
        END,
        -- Skin fields
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
        -- Welcome flag
        welcome_shown = COALESCE((p_data->>'welcome_shown')::BOOLEAN, welcome_shown)
    WHERE telegram_id = p_telegram_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN players.unlocked_skins IS 'Массив ID разблокированных скинов (получены за убийство боссов)';
COMMENT ON COLUMN players.wizard_skins IS 'Объект {wizard_id: skin_id} - выбранные скины для магов';
