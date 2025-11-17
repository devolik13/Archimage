-- Migration: Refactor players table schema
-- Date: 2025-11-16
-- Description: Remove redundant fields, add battle stats and rating system

-- 1. Remove redundant columns
ALTER TABLE players DROP COLUMN IF EXISTS available_spells;
ALTER TABLE players DROP COLUMN IF EXISTS last_save;

-- 2. Add new battle statistics columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_battles INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 1000;

-- 3. Add progression and settings columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS pve_progress JSONB DEFAULT '{}'::jsonb;
ALTER TABLE players ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"sound": true, "language": "ru", "battle_speed": "normal"}'::jsonb;
ALTER TABLE players ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT false;

-- 4. Add timestamp column
ALTER TABLE players ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- 5. Drop battle_history table if exists (redundant)
DROP TABLE IF EXISTS battle_history;

-- 6. Create index for rating-based matchmaking
CREATE INDEX IF NOT EXISTS idx_players_rating ON players(rating);

-- 7. Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_players_wins ON players(wins DESC);

-- 8. Update existing players to have default values
UPDATE players
SET
    total_battles = COALESCE(total_battles, 0),
    wins = COALESCE(wins, 0),
    losses = COALESCE(losses, 0),
    rating = COALESCE(rating, 1000),
    pve_progress = COALESCE(pve_progress, '{}'::jsonb),
    settings = COALESCE(settings, '{"sound": true, "language": "ru", "battle_speed": "normal"}'::jsonb),
    tutorial_completed = COALESCE(tutorial_completed, false),
    created_at = COALESCE(created_at, NOW())
WHERE telegram_id IS NOT NULL;

-- 9. Comment on new columns for documentation
COMMENT ON COLUMN players.total_battles IS 'Total number of battles played (PvP + PvE)';
COMMENT ON COLUMN players.wins IS 'Total wins';
COMMENT ON COLUMN players.losses IS 'Total losses';
COMMENT ON COLUMN players.rating IS 'Player rating for matchmaking (default 1000)';
COMMENT ON COLUMN players.pve_progress IS 'Progress in PvE missions as JSONB';
COMMENT ON COLUMN players.settings IS 'Player settings: sound, language, battle speed';
COMMENT ON COLUMN players.tutorial_completed IS 'Whether player completed tutorial';
COMMENT ON COLUMN players.created_at IS 'Account creation timestamp';
