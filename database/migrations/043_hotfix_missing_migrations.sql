-- Migration 043: HOTFIX - Apply all missing schema from migrations 016-041
-- Problem: Migrations 15 and 42 were applied, but 16-41 were skipped.
-- This left update_player_safe at migration 15 version (missing many fields)
-- and many columns/tables were never created.
--
-- This single migration adds everything that was missed.
-- All statements use IF NOT EXISTS / OR REPLACE for safety.

-- ============================================
-- STEP 1: Missing columns on players table
-- ============================================

-- From migration 016
ALTER TABLE players ADD COLUMN IF NOT EXISTS current_season INTEGER DEFAULT 1;
DO $$ BEGIN
    ALTER TABLE players ADD COLUMN season_league_rewards_claimed TEXT[] DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- From migration 018
ALTER TABLE players ADD COLUMN IF NOT EXISTS unlocked_skins JSONB DEFAULT '[]';
ALTER TABLE players ADD COLUMN IF NOT EXISTS wizard_skins JSONB DEFAULT '{}';

-- From migration 019
ALTER TABLE players ADD COLUMN IF NOT EXISTS training_dummy_progress JSONB DEFAULT NULL;

-- From migration 032
ALTER TABLE players ADD COLUMN IF NOT EXISTS group_reward_claimed BOOLEAN DEFAULT FALSE;

-- From migration 040
ALTER TABLE players ADD COLUMN IF NOT EXISTS completed_tasks JSONB DEFAULT '{}';

-- From migration 041
ALTER TABLE players ADD COLUMN IF NOT EXISTS time_currency_base INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS time_currency_updated_at TIMESTAMPTZ DEFAULT now();

-- Migrate existing time_currency into time_currency_base (for players who have balance)
UPDATE players
SET
  time_currency_base = COALESCE(time_currency, 0),
  time_currency_updated_at = now()
WHERE time_currency_base = 0 AND COALESCE(time_currency, 0) > 0;

-- ============================================
-- STEP 2: Missing tables
-- ============================================

-- From migration 016: season_config
CREATE TABLE IF NOT EXISTS season_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    current_season INTEGER NOT NULL DEFAULT 1,
    season_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    season_end_date TIMESTAMPTZ,
    CHECK (id = 1)
);
INSERT INTO season_config (id, current_season, season_start_date)
VALUES (1, 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- From migration 017: payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL REFERENCES players(telegram_id),
    product_id TEXT NOT NULL,
    amount_stars INTEGER,
    amount_ton DECIMAL(20, 9),
    payment_method TEXT DEFAULT 'stars',
    ton_transaction_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    payload TEXT,
    invoice_url TEXT,
    telegram_payment_id TEXT,
    target_faction TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payments_telegram_id ON payments(telegram_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- From migration 020: referrals
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_telegram_id BIGINT NOT NULL REFERENCES players(telegram_id) ON DELETE CASCADE,
    referred_telegram_id BIGINT NOT NULL REFERENCES players(telegram_id) ON DELETE CASCADE,
    reward_amount INTEGER NOT NULL DEFAULT 1440,
    reward_claimed BOOLEAN DEFAULT true,
    total_purchase_bonus INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_referred UNIQUE (referred_telegram_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_telegram_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_telegram_id);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);

-- Grant permissions for referrals
DO $$ BEGIN
    ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view own referrals" ON referrals
        FOR SELECT USING (
            referrer_telegram_id = current_setting('app.current_user_id', true)::BIGINT
            OR referred_telegram_id = current_setting('app.current_user_id', true)::BIGINT
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Service can manage referrals" ON referrals
        FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT SELECT, INSERT, UPDATE ON referrals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON referrals TO anon;
DO $$ BEGIN
    GRANT USAGE, SELECT ON SEQUENCE referrals_id_seq TO authenticated;
    GRANT USAGE, SELECT ON SEQUENCE referrals_id_seq TO anon;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================
-- STEP 3: Missing RPC functions
-- ============================================

-- From migration 016: season functions
CREATE OR REPLACE FUNCTION get_current_season()
RETURNS TABLE(season INTEGER, start_date TIMESTAMPTZ, end_date TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY SELECT current_season, season_start_date, season_end_date FROM season_config WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION start_new_season(p_new_season_number INTEGER DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_new_season INTEGER;
BEGIN
    v_new_season := COALESCE(p_new_season_number, (SELECT current_season + 1 FROM season_config WHERE id = 1));
    UPDATE season_config SET current_season = v_new_season, season_start_date = NOW(), season_end_date = NULL WHERE id = 1;
    UPDATE players SET rating = GREATEST(500, (rating / 2) + 500), current_season = v_new_season, season_league_rewards_claimed = '{}';
END;
$$ LANGUAGE plpgsql;

-- From migration 020: referral functions
CREATE OR REPLACE FUNCTION get_referral_count(p_telegram_id BIGINT)
RETURNS INTEGER AS $$
DECLARE result INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO result FROM referrals WHERE referrer_telegram_id = p_telegram_id;
    RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_referral_stats(p_telegram_id BIGINT)
RETURNS TABLE(referral_count INTEGER, total_time_earned INTEGER, total_purchase_bonus INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(*)::INTEGER, COALESCE(SUM(reward_amount), 0)::INTEGER, COALESCE(SUM(r.total_purchase_bonus), 0)::INTEGER
    FROM referrals r WHERE r.referrer_telegram_id = p_telegram_id;
END;
$$ LANGUAGE plpgsql;

-- From migration 041: time currency functions
CREATE OR REPLACE FUNCTION get_generator_level(p_buildings JSONB)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((p_buildings->'time_generator'->>'level')::INTEGER, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_time_currency(p_telegram_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
  v_base INTEGER; v_updated TIMESTAMPTZ; v_buildings JSONB;
  v_gen_level INTEGER; v_rate NUMERIC; v_max_storage INTEGER;
  v_elapsed_hours NUMERIC; v_earned INTEGER;
BEGIN
  SELECT time_currency_base, time_currency_updated_at, buildings
  INTO v_base, v_updated, v_buildings FROM players WHERE telegram_id = p_telegram_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  v_gen_level := get_generator_level(v_buildings);
  IF v_gen_level = 0 THEN RETURN v_base; END IF;
  v_rate := 36.0 + (v_gen_level - 1) * 7.6;
  v_max_storage := 1037 + (v_gen_level - 1) * 219;
  v_elapsed_hours := EXTRACT(EPOCH FROM (now() - v_updated)) / 3600.0;
  v_earned := LEAST(FLOOR(v_elapsed_hours * v_rate)::INTEGER, v_max_storage);
  RETURN v_base + v_earned;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION spend_time_currency(p_telegram_id BIGINT, p_amount INTEGER)
RETURNS JSONB AS $$
DECLARE v_current INTEGER; v_new_base INTEGER;
BEGIN
  v_current := get_time_currency(p_telegram_id);
  IF v_current < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_funds', 'current', v_current, 'required', p_amount);
  END IF;
  v_new_base := v_current - p_amount;
  UPDATE players SET time_currency_base = v_new_base, time_currency_updated_at = now(), time_currency = v_new_base WHERE telegram_id = p_telegram_id;
  RETURN jsonb_build_object('success', true, 'new_balance', v_new_base, 'spent', p_amount);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_time_currency(p_telegram_id BIGINT, p_amount INTEGER)
RETURNS JSONB AS $$
DECLARE v_current INTEGER; v_new_base INTEGER;
BEGIN
  v_current := get_time_currency(p_telegram_id);
  v_new_base := LEAST(v_current + p_amount, 999999);
  UPDATE players SET time_currency_base = v_new_base, time_currency_updated_at = now(), time_currency = v_new_base WHERE telegram_id = p_telegram_id;
  RETURN jsonb_build_object('success', true, 'new_balance', v_new_base, 'added', p_amount);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION snapshot_time_currency(p_telegram_id BIGINT)
RETURNS INTEGER AS $$
DECLARE v_current INTEGER;
BEGIN
  v_current := get_time_currency(p_telegram_id);
  UPDATE players SET time_currency_base = v_current, time_currency_updated_at = now(), time_currency = v_current WHERE telegram_id = p_telegram_id;
  RETURN v_current;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 4: THE CRITICAL FIX - update_player_safe (latest version from migration 041)
-- This is the root cause of all bugs - the old version from migration 015
-- was missing time_currency_base, skins, seasons, tasks, etc.
-- ============================================

CREATE OR REPLACE FUNCTION update_player_safe(p_telegram_id BIGINT, p_data JSONB)
RETURNS VOID AS $$
DECLARE
    current_points INTEGER;
    new_points INTEGER;
BEGIN
    -- Anti-cheat: airdrop_points can only increase
    SELECT airdrop_points INTO current_points FROM players WHERE telegram_id = p_telegram_id;
    new_points := COALESCE((p_data->>'airdrop_points')::INTEGER, current_points);

    IF new_points < current_points THEN
        RAISE NOTICE 'airdrop_points: attempt to decrease % -> %, keeping %', current_points, new_points, current_points;
        new_points := current_points;
    END IF;

    UPDATE players
    SET
        username = COALESCE(p_data->>'username', username),
        level = COALESCE((p_data->>'level')::INTEGER, level),
        rating = COALESCE((p_data->>'rating')::INTEGER, rating),
        wins = COALESCE((p_data->>'wins')::INTEGER, wins),
        losses = COALESCE((p_data->>'losses')::INTEGER, losses),
        total_battles = COALESCE((p_data->>'total_battles')::INTEGER, total_battles),
        faction = COALESCE(p_data->>'faction', faction),
        faction_changed = COALESCE((p_data->>'faction_changed')::BOOLEAN, faction_changed),
        wizards = CASE
            WHEN p_data ? 'wizards' AND p_data->'wizards' IS NOT NULL
            THEN p_data->'wizards'
            ELSE wizards
        END,
        spells = CASE
            WHEN p_data ? 'spells' AND p_data->'spells' IS NOT NULL
            THEN p_data->'spells'
            ELSE spells
        END,
        formation = CASE
            WHEN p_data ? 'formation' AND p_data->'formation' IS NOT NULL
            THEN p_data->'formation'
            ELSE formation
        END,
        buildings = CASE
            WHEN p_data ? 'buildings' AND p_data->'buildings' IS NOT NULL
            THEN p_data->'buildings'
            ELSE buildings
        END,
        -- LAZY ACCRUAL: time_currency_base and updated_at
        time_currency_base = CASE
            WHEN p_data ? 'time_currency_base' AND p_data->>'time_currency_base' IS NOT NULL
            THEN (p_data->>'time_currency_base')::INTEGER
            ELSE time_currency_base
        END,
        time_currency_updated_at = CASE
            WHEN p_data ? 'time_currency_updated_at' AND p_data->>'time_currency_updated_at' IS NOT NULL
            THEN (p_data->>'time_currency_updated_at')::TIMESTAMPTZ
            ELSE time_currency_updated_at
        END,
        -- Keep old time_currency in sync
        time_currency = CASE
            WHEN p_data ? 'time_currency_base' AND p_data->>'time_currency_base' IS NOT NULL
            THEN (p_data->>'time_currency_base')::INTEGER
            WHEN p_data ? 'time_currency' AND p_data->>'time_currency' IS NOT NULL
            THEN (p_data->>'time_currency')::INTEGER
            ELSE time_currency
        END,
        last_login = CASE
            WHEN p_data ? 'last_login' AND p_data->>'last_login' IS NOT NULL
            THEN (p_data->>'last_login')::TIMESTAMPTZ
            ELSE last_login
        END,
        purchased_packs = CASE
            WHEN p_data ? 'purchased_packs' AND p_data->'purchased_packs' IS NOT NULL
            THEN p_data->'purchased_packs'
            ELSE purchased_packs
        END,
        airdrop_points = new_points,
        airdrop_breakdown = CASE
            WHEN p_data ? 'airdrop_breakdown' AND p_data->'airdrop_breakdown' IS NOT NULL
            THEN p_data->'airdrop_breakdown'
            ELSE airdrop_breakdown
        END,
        wallet_address = COALESCE(p_data->>'wallet_address', wallet_address),
        wallet_connected_at = CASE
            WHEN p_data ? 'wallet_connected_at' AND p_data->'wallet_connected_at' IS NOT NULL
            THEN TO_TIMESTAMP((p_data->>'wallet_connected_at')::BIGINT / 1000.0)
            ELSE wallet_connected_at
        END,
        battle_energy = CASE
            WHEN p_data ? 'battle_energy' AND p_data->'battle_energy' IS NOT NULL
            THEN p_data->'battle_energy'
            ELSE battle_energy
        END,
        pve_progress = CASE
            WHEN p_data ? 'pve_progress' AND p_data->'pve_progress' IS NOT NULL
            THEN p_data->'pve_progress'
            ELSE pve_progress
        END,
        daily_login = CASE
            WHEN p_data ? 'daily_login' AND p_data->'daily_login' IS NOT NULL
            THEN p_data->'daily_login'
            ELSE daily_login
        END,
        current_season = COALESCE((p_data->>'current_season')::INTEGER, current_season),
        season_league_rewards_claimed = CASE
            WHEN p_data ? 'season_league_rewards_claimed' AND p_data->'season_league_rewards_claimed' IS NOT NULL
            THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'season_league_rewards_claimed'))
            ELSE season_league_rewards_claimed
        END,
        unlocked_skins = CASE
            WHEN p_data ? 'unlocked_skins' AND p_data->'unlocked_skins' IS NOT NULL
            THEN p_data->'unlocked_skins'
            ELSE unlocked_skins
        END,
        wizard_skins = CASE
            WHEN p_data ? 'wizard_skins' AND p_data->'wizard_skins' IS NOT NULL
            THEN p_data->'wizard_skins'
            ELSE wizard_skins
        END,
        training_dummy_progress = CASE
            WHEN p_data ? 'training_dummy_progress' AND p_data->'training_dummy_progress' IS NOT NULL
            THEN p_data->'training_dummy_progress'
            ELSE training_dummy_progress
        END,
        welcome_shown = COALESCE((p_data->>'welcome_shown')::BOOLEAN, welcome_shown),
        settings = CASE
            WHEN p_data ? 'settings' AND p_data->'settings' IS NOT NULL
            THEN p_data->'settings'
            ELSE settings
        END,
        completed_tasks = CASE
            WHEN p_data ? 'completed_tasks' AND p_data->'completed_tasks' IS NOT NULL
            THEN p_data->'completed_tasks'
            ELSE completed_tasks
        END,
        guild_id = CASE
            WHEN p_data ? 'guild_id' AND p_data->>'guild_id' IS NOT NULL
            THEN (p_data->>'guild_id')::INTEGER
            ELSE guild_id
        END,
        guild_contribution = CASE
            WHEN p_data ? 'guild_contribution' AND p_data->>'guild_contribution' IS NOT NULL
            THEN (p_data->>'guild_contribution')::BIGINT
            ELSE guild_contribution
        END,
        guild_last_active = CASE
            WHEN p_data ? 'guild_last_active' AND p_data->>'guild_last_active' IS NOT NULL
            THEN (p_data->>'guild_last_active')::TIMESTAMPTZ
            ELSE guild_last_active
        END
    WHERE telegram_id = p_telegram_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_players_current_season ON players(current_season);
CREATE INDEX IF NOT EXISTS idx_players_rating_season ON players(rating DESC, current_season);
