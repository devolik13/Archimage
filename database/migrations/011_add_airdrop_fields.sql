-- Migration: Add airdrop and wallet fields
-- Date: 2025-12-02
-- Description: Prepare structure for future airdrop integration

-- Wallet address for TON Connect
ALTER TABLE players ADD COLUMN IF NOT EXISTS wallet_address TEXT DEFAULT NULL;

-- Airdrop points (accumulated from gameplay)
ALTER TABLE players ADD COLUMN IF NOT EXISTS airdrop_points INTEGER DEFAULT 0;

-- Timestamp when wallet was connected
ALTER TABLE players ADD COLUMN IF NOT EXISTS wallet_connected_at TIMESTAMPTZ DEFAULT NULL;

-- Index for finding players with wallets (for airdrop distribution)
CREATE INDEX IF NOT EXISTS idx_players_wallet ON players(wallet_address) WHERE wallet_address IS NOT NULL;

-- Index for airdrop leaderboard
CREATE INDEX IF NOT EXISTS idx_players_airdrop_points ON players(airdrop_points DESC) WHERE airdrop_points > 0;

-- Comments
COMMENT ON COLUMN players.wallet_address IS 'TON wallet address for airdrop';
COMMENT ON COLUMN players.airdrop_points IS 'Points accumulated for future airdrop';
COMMENT ON COLUMN players.wallet_connected_at IS 'When the wallet was first connected';
