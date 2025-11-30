-- Migration: Add guild system
-- Date: 2025-11-30
-- Description: Add guilds table and guild-related fields to players

-- 1. Create guilds table
CREATE TABLE IF NOT EXISTS guilds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    tag VARCHAR(5) NOT NULL,
    leader_id INTEGER NOT NULL,
    experience BIGINT DEFAULT 0,
    level INTEGER DEFAULT 1,
    bonus_points INTEGER DEFAULT 1,  -- очки исследований (1 за уровень + за каждое заполнение 30 ур.)
    research JSONB DEFAULT '{"fire":0,"water":0,"earth":0,"wind":0,"poison":0}'::jsonb,
    join_mode VARCHAR(10) DEFAULT 'free',  -- 'free' или 'request'
    join_requests JSONB DEFAULT '[]'::jsonb,  -- массив заявок [{player_id, username, date}]
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add guild-related columns to players
ALTER TABLE players ADD COLUMN IF NOT EXISTS guild_id INTEGER REFERENCES guilds(id) ON DELETE SET NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS guild_contribution BIGINT DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS guild_last_active TIMESTAMP DEFAULT NOW();

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guilds_leader ON guilds(leader_id);
CREATE INDEX IF NOT EXISTS idx_guilds_level ON guilds(level DESC);
CREATE INDEX IF NOT EXISTS idx_players_guild ON players(guild_id);
CREATE INDEX IF NOT EXISTS idx_players_contribution ON players(guild_contribution DESC);

-- 4. Add foreign key for leader after players table has guild_id
-- (leader_id references players.id)
ALTER TABLE guilds DROP CONSTRAINT IF EXISTS guilds_leader_id_fkey;
ALTER TABLE guilds ADD CONSTRAINT guilds_leader_id_fkey
    FOREIGN KEY (leader_id) REFERENCES players(id) ON DELETE CASCADE;

-- 5. Comments for documentation
COMMENT ON TABLE guilds IS 'Guild system: players can create/join guilds for bonuses';
COMMENT ON COLUMN guilds.name IS 'Unique guild name (max 50 chars)';
COMMENT ON COLUMN guilds.tag IS 'Short tag displayed before player name [TAG] (max 5 chars)';
COMMENT ON COLUMN guilds.leader_id IS 'Player ID of guild leader';
COMMENT ON COLUMN guilds.experience IS 'Total guild experience (from member battles)';
COMMENT ON COLUMN guilds.level IS 'Guild level 1-30, affects bonuses';
COMMENT ON COLUMN guilds.bonus_points IS 'Research points to spend on resistances';
COMMENT ON COLUMN guilds.research IS 'Resistance research: fire/water/earth/wind/poison (max 30 each = 15%)';
COMMENT ON COLUMN guilds.join_mode IS 'Join mode: free (anyone) or request (leader approves)';
COMMENT ON COLUMN guilds.join_requests IS 'Pending join requests array';
COMMENT ON COLUMN players.guild_id IS 'Guild membership (NULL if not in guild)';
COMMENT ON COLUMN players.guild_contribution IS 'Total experience contributed to guild';
COMMENT ON COLUMN players.guild_last_active IS 'Last activity timestamp for leader transfer';
