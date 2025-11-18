-- Migration: Add battle energy system
-- Date: 2025-11-18
-- Description: Add battle_energy JSONB field to limit battles (12 per day, +1 every 2 hours)

-- 1. Add battle_energy column
ALTER TABLE players ADD COLUMN IF NOT EXISTS battle_energy JSONB DEFAULT '{
    "current": 12,
    "max": 12,
    "last_regen": 0
}'::jsonb;

-- 2. Update existing players to have full energy
UPDATE players
SET battle_energy = jsonb_build_object(
    'current', 12,
    'max', 12,
    'last_regen', EXTRACT(EPOCH FROM NOW()) * 1000
)
WHERE telegram_id IS NOT NULL AND battle_energy IS NULL;

-- 3. Comment on new column for documentation
COMMENT ON COLUMN players.battle_energy IS 'Battle energy system: max 12 battles, +1 every 2 hours. Format: {"current": 12, "max": 12, "last_regen": timestamp_ms}';
