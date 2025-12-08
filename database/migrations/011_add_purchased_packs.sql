-- Migration: Add purchased_packs column
-- Date: 2025-12-08
-- Description: Add column to store purchased starter packs

-- Add purchased_packs column as JSONB
ALTER TABLE players ADD COLUMN IF NOT EXISTS purchased_packs JSONB DEFAULT '{}';

-- Drop existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS update_player_safe(bigint, jsonb);

-- Update RPC function to handle purchased_packs
CREATE OR REPLACE FUNCTION update_player_safe(p_telegram_id BIGINT, p_data JSONB)
RETURNS VOID AS $$
BEGIN
    UPDATE players
    SET
        -- Basic data (BIGINT types)
        time_currency = COALESCE((p_data->>'time_currency')::BIGINT, time_currency),
        level = COALESCE((p_data->>'level')::BIGINT, level),
        experience = COALESCE((p_data->>'experience')::BIGINT, experience),
        faction = COALESCE(p_data->>'faction', faction),
        faction_changed = COALESCE((p_data->>'faction_changed')::BOOLEAN, faction_changed),

        -- JSONB fields
        wizards = COALESCE(p_data->'wizards', wizards),
        formation = COALESCE(p_data->'formation', formation),
        spells = COALESCE(p_data->'spells', spells),
        buildings = COALESCE(p_data->'buildings', buildings),
        pve_progress = COALESCE(p_data->'pve_progress', pve_progress),
        settings = COALESCE(p_data->'settings', settings),
        daily_login = COALESCE(p_data->'daily_login', daily_login),
        battle_energy = COALESCE(p_data->'battle_energy', battle_energy),
        purchased_packs = COALESCE(p_data->'purchased_packs', purchased_packs),

        -- Stats
        total_battles = COALESCE((p_data->>'total_battles')::INTEGER, total_battles),
        wins = COALESCE((p_data->>'wins')::INTEGER, wins),
        losses = COALESCE((p_data->>'losses')::INTEGER, losses),
        rating = COALESCE((p_data->>'rating')::INTEGER, rating),

        -- Blessing (JSONB and BIGINT types)
        active_blessing = COALESCE(p_data->'active_blessing', active_blessing),
        blessing_last_used = COALESCE((p_data->>'blessing_last_used')::BIGINT, blessing_last_used),

        -- Other
        welcome_shown = COALESCE((p_data->>'welcome_shown')::BOOLEAN, welcome_shown),
        last_login = COALESCE((p_data->>'last_login')::TIMESTAMPTZ, NOW())
    WHERE telegram_id = p_telegram_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON COLUMN players.purchased_packs IS 'JSONB object storing purchased starter packs with timestamps';
