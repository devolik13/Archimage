-- Migration: Change default rating from 1000 to 0
-- Date: 2025-12-01
-- Description: New players start at rating 0 to match with Адепт bots (100-900)

-- Change default rating for new players
ALTER TABLE players ALTER COLUMN rating SET DEFAULT 0;

-- Update comment
COMMENT ON COLUMN players.rating IS 'Player rating for matchmaking (default 0, Адепт league)';
