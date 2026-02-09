-- Migration 041: Lazy time currency accrual system
-- Instead of storing a constantly-updated balance, we store:
--   time_currency_base: balance at the moment of last write
--   time_currency_updated_at: server timestamp of that write
-- Current balance is computed: base + elapsed_time * production_rate
-- This eliminates client-time dependency, background suspension bugs,
-- and reduces DB writes by 10-100x.

-- Step 1: Add new columns (keeping old time_currency as backup)
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS time_currency_base INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_currency_updated_at TIMESTAMPTZ DEFAULT now();

-- Step 2: Migrate existing data - transfer current balances
-- Players keep exactly what they have now
UPDATE players
SET
  time_currency_base = COALESCE(time_currency, 0),
  time_currency_updated_at = now();

-- Step 3: Function to get generator level from buildings JSONB
CREATE OR REPLACE FUNCTION get_generator_level(p_buildings JSONB)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (p_buildings->'time_generator'->>'level')::INTEGER,
    0
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Function to calculate current time currency (server-side)
CREATE OR REPLACE FUNCTION get_time_currency(p_telegram_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
  v_base INTEGER;
  v_updated TIMESTAMPTZ;
  v_buildings JSONB;
  v_gen_level INTEGER;
  v_rate NUMERIC;
  v_max_storage INTEGER;
  v_elapsed_hours NUMERIC;
  v_earned INTEGER;
BEGIN
  SELECT time_currency_base, time_currency_updated_at, buildings
  INTO v_base, v_updated, v_buildings
  FROM players
  WHERE telegram_id = p_telegram_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_gen_level := get_generator_level(v_buildings);

  -- No generator = no production
  IF v_gen_level = 0 THEN
    RETURN v_base;
  END IF;

  -- Production formula: 36 + (level-1) * 7.6 min/hour
  v_rate := 36.0 + (v_gen_level - 1) * 7.6;

  -- Storage cap: 1037 + (level-1) * 219 min
  v_max_storage := 1037 + (v_gen_level - 1) * 219;

  -- Elapsed hours since last update
  v_elapsed_hours := EXTRACT(EPOCH FROM (now() - v_updated)) / 3600.0;

  -- Earned = min(elapsed * rate, storage_cap)
  v_earned := LEAST(FLOOR(v_elapsed_hours * v_rate)::INTEGER, v_max_storage);

  RETURN v_base + v_earned;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 5: Function to spend time currency (atomic server-side operation)
CREATE OR REPLACE FUNCTION spend_time_currency(
  p_telegram_id BIGINT,
  p_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current INTEGER;
  v_new_base INTEGER;
BEGIN
  -- Calculate current balance
  v_current := get_time_currency(p_telegram_id);

  -- Check if enough
  IF v_current < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_funds',
      'current', v_current,
      'required', p_amount
    );
  END IF;

  -- Set new base = current - spent, reset timestamp
  v_new_base := v_current - p_amount;

  UPDATE players
  SET
    time_currency_base = v_new_base,
    time_currency_updated_at = now(),
    time_currency = v_new_base  -- Keep old column in sync for compatibility
  WHERE telegram_id = p_telegram_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_base,
    'spent', p_amount
  );
END;
$$ LANGUAGE plpgsql;

-- Step 6: Function to add time currency (rewards, daily login)
CREATE OR REPLACE FUNCTION add_time_currency(
  p_telegram_id BIGINT,
  p_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current INTEGER;
  v_new_base INTEGER;
BEGIN
  -- Calculate current balance (includes accumulated)
  v_current := get_time_currency(p_telegram_id);

  -- Add reward
  v_new_base := v_current + p_amount;

  -- Cap at 999999
  v_new_base := LEAST(v_new_base, 999999);

  UPDATE players
  SET
    time_currency_base = v_new_base,
    time_currency_updated_at = now(),
    time_currency = v_new_base  -- Keep old column in sync
  WHERE telegram_id = p_telegram_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_base,
    'added', p_amount
  );
END;
$$ LANGUAGE plpgsql;

-- Step 7: Function to snapshot balance (called when generator level changes)
-- This "freezes" the accumulated amount into base before rate changes
CREATE OR REPLACE FUNCTION snapshot_time_currency(p_telegram_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
  v_current INTEGER;
BEGIN
  v_current := get_time_currency(p_telegram_id);

  UPDATE players
  SET
    time_currency_base = v_current,
    time_currency_updated_at = now(),
    time_currency = v_current
  WHERE telegram_id = p_telegram_id;

  RETURN v_current;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Update the main update_player_safe to handle new fields
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
        -- NEW: time_currency_base and updated_at for lazy accrual
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
        -- OLD: keep time_currency in sync for backward compatibility
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
