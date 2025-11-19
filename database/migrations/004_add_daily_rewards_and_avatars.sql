-- Migration: Add daily login rewards and avatar support
-- Date: 2025-11-18
-- Description: Add daily_login, avatar_url, platform, and vk_id fields

-- 1. Add daily_login column (JSONB format)
ALTER TABLE players ADD COLUMN IF NOT EXISTS daily_login JSONB DEFAULT '{
    "day": 1,
    "last_login_date": null,
    "total_logins": 0
}'::jsonb;

-- 2. Add avatar support columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMP WITH TIME ZONE;

-- 3. Add platform support (for Telegram and VK)
ALTER TABLE players ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'telegram';
ALTER TABLE players ADD COLUMN IF NOT EXISTS vk_id BIGINT;

-- 4. Create unique indexes for platform IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_telegram_id ON players(telegram_id) WHERE telegram_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_vk_id ON players(vk_id) WHERE vk_id IS NOT NULL;

-- 5. Initialize daily_login for existing players
UPDATE players
SET daily_login = jsonb_build_object(
    'day', 1,
    'last_login_date', NULL,
    'total_logins', 0
)
WHERE telegram_id IS NOT NULL AND daily_login IS NULL;

-- 6. Comments on new columns for documentation
COMMENT ON COLUMN players.daily_login IS 'Daily login reward system: day 1-24 = 1-24 hours, 24+ always 24 hours. No streak reset on skip. Format: {"day": 1, "last_login_date": "ISO date", "total_logins": 0}';
COMMENT ON COLUMN players.avatar_url IS 'Player avatar URL from Telegram/VK, cached for 24 hours';
COMMENT ON COLUMN players.avatar_updated_at IS 'Timestamp when avatar_url was last updated';
COMMENT ON COLUMN players.platform IS 'Platform source: telegram or vk';
COMMENT ON COLUMN players.vk_id IS 'VK user ID (for VKontakte integration)';
