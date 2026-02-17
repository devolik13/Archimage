-- ============================================
-- Migration 061: Fix trial_leaderboard foreign key
--
-- Bug: trial_leaderboard.player_id FK references players(telegram_id)
--      instead of players(id). After migration 057 fixed functions to
--      write players.id into player_id, all INSERTs fail because
--      FK checks player_id value against telegram_id column.
--
-- Fix: Drop wrong FK, recreate referencing players(id).
-- ============================================

-- Drop the incorrect foreign key
ALTER TABLE trial_leaderboard
DROP CONSTRAINT trial_leaderboard_player_id_fkey;

-- Recreate with correct reference to players(id)
ALTER TABLE trial_leaderboard
ADD CONSTRAINT trial_leaderboard_player_id_fkey
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
