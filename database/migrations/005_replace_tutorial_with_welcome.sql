-- Migration: Replace tutorial system with simple welcome message
-- Date: 2025-11-19
-- Description: Remove complex tutorial fields and add simple welcome_shown flag

-- 1. Remove old tutorial columns
ALTER TABLE players DROP COLUMN IF EXISTS tutorial_completed;
ALTER TABLE players DROP COLUMN IF EXISTS tutorial_step;

-- 2. Add new welcome_shown column
ALTER TABLE players ADD COLUMN IF NOT EXISTS welcome_shown BOOLEAN DEFAULT false;

-- 3. Update existing players to have welcome already shown (they've already been onboarded)
UPDATE players
SET welcome_shown = true
WHERE telegram_id IS NOT NULL;

-- 4. Comment for documentation
COMMENT ON COLUMN players.welcome_shown IS 'Whether the welcome message has been shown to the player';
