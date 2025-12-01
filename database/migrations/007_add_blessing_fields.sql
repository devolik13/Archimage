-- Migration: Add blessing fields to players table
-- Date: 2025-12-01
-- Description: Add fields for blessing tower system persistence

-- 1. Add blessing columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS active_blessing JSONB DEFAULT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS blessing_last_used BIGINT DEFAULT NULL;

-- 2. Comments for documentation
COMMENT ON COLUMN players.active_blessing IS 'Currently active blessing data (id, name, icon, expires_at, etc.)';
COMMENT ON COLUMN players.blessing_last_used IS 'Timestamp (ms) when blessing was last used, for cooldown calculation';
