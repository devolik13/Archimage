-- Migration 018: Add last_login column to players table
-- This column tracks when player last logged in for offline earnings calculation

-- Add the last_login column
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NOW();

-- Update existing players to have current timestamp as last_login
UPDATE players SET last_login = NOW() WHERE last_login IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN players.last_login IS 'Last login timestamp for offline earnings calculation';

-- Create index for potential queries
CREATE INDEX IF NOT EXISTS idx_players_last_login ON players(last_login);
