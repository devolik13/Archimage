-- Migration: Add performance indexes
-- Date: 2025-12-01
-- Description: Indexes for 10000+ players scalability

-- 1. Unique index on telegram_id (critical for login)
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_telegram_id ON players(telegram_id);

-- 2. Index for matchmaking by rating range
CREATE INDEX IF NOT EXISTS idx_players_rating_faction ON players(rating, faction);

-- 3. Index for leaderboard queries (rating DESC)
CREATE INDEX IF NOT EXISTS idx_players_rating_desc ON players(rating DESC);

-- 4. Index for guild member lookups
CREATE INDEX IF NOT EXISTS idx_players_guild_contribution ON players(guild_id, guild_contribution DESC);

-- 5. GIN indexes for JSONB search (if needed for filtering by spells/buildings)
-- CREATE INDEX IF NOT EXISTS idx_players_spells_gin ON players USING GIN(spells);
-- CREATE INDEX IF NOT EXISTS idx_players_buildings_gin ON players USING GIN(buildings);

-- 6. Index for finding bots (negative telegram_id)
CREATE INDEX IF NOT EXISTS idx_players_bots ON players(telegram_id) WHERE telegram_id < 0;

-- 7. Index for blessing cooldown checks
CREATE INDEX IF NOT EXISTS idx_players_blessing ON players(blessing_last_used) WHERE blessing_last_used IS NOT NULL;

-- 8. Guild indexes
CREATE INDEX IF NOT EXISTS idx_guilds_name ON guilds(name);
CREATE INDEX IF NOT EXISTS idx_guilds_level_exp ON guilds(level DESC, experience DESC);

-- Documentation
COMMENT ON INDEX idx_players_telegram_id IS 'Fast login lookup by Telegram ID';
COMMENT ON INDEX idx_players_rating_faction IS 'Matchmaking: find players by rating and faction';
COMMENT ON INDEX idx_players_bots IS 'Partial index for bot queries only';
