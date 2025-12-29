-- Migration 028: Fix guild_id null handling in update_player_safe
-- Problem: When guild_id is passed as null, it was resetting player's guild membership
-- Solution: Only update guild_id if the value is NOT NULL

CREATE OR REPLACE FUNCTION update_player_safe(p_telegram_id BIGINT, p_data JSONB)
RETURNS VOID AS $$
DECLARE
    current_points INTEGER;
    new_points INTEGER;
BEGIN
    -- Anti-cheat: airdrop_points могут только расти
    SELECT airdrop_points INTO current_points FROM players WHERE telegram_id = p_telegram_id;
    new_points := COALESCE((p_data->>'airdrop_points')::INTEGER, current_points);

    IF new_points < current_points THEN
        RAISE EXCEPTION 'Попытка уменьшить airdrop_points: % -> %', current_points, new_points;
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
        time_currency = COALESCE((p_data->>'time_currency')::INTEGER, time_currency),
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
        -- GUILD FIELDS: FIX - only update if value is NOT NULL (to allow explicit leave via guild manager)
        guild_id = CASE
            WHEN p_data ? 'guild_id' AND p_data->>'guild_id' IS NOT NULL
            THEN (p_data->>'guild_id')::INTEGER
            ELSE guild_id  -- Keep existing value if null passed
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

COMMENT ON FUNCTION update_player_safe(bigint, jsonb) IS 'Безопасное обновление данных игрока. FIX: guild_id теперь не сбрасывается при передаче null - для выхода из гильдии используйте leave_guild RPC.';

-- Отдельная RPC для выхода из гильдии (явное обнуление guild_id)
CREATE OR REPLACE FUNCTION leave_guild(p_telegram_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_player_id INTEGER;
    v_guild_id INTEGER;
BEGIN
    -- Получаем данные игрока
    SELECT id, guild_id INTO v_player_id, v_guild_id
    FROM players
    WHERE telegram_id = p_telegram_id;

    IF v_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Игрок не найден');
    END IF;

    IF v_guild_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Вы не состоите в гильдии');
    END IF;

    -- Обнуляем guild_id
    UPDATE players
    SET
        guild_id = NULL,
        guild_contribution = 0,
        guild_last_active = NULL
    WHERE telegram_id = p_telegram_id;

    RETURN jsonb_build_object('success', true, 'message', 'Вы вышли из гильдии');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION leave_guild(bigint) IS 'Выход игрока из гильдии - явное обнуление guild_id.';
