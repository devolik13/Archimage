-- Migration: Add airdrop fields to update_player_safe RPC
-- Date: 2025-12-10
-- Description: Add airdrop_points, wallet_address, wallet_connected_at to RPC function

-- Drop and recreate the function with airdrop fields
DROP FUNCTION IF EXISTS update_player_safe(bigint, jsonb);

CREATE OR REPLACE FUNCTION update_player_safe(p_telegram_id BIGINT, p_data JSONB)
RETURNS VOID AS $$
DECLARE
    current_points INTEGER;
    new_points INTEGER;
BEGIN
    -- Получаем текущие очки для валидации
    SELECT airdrop_points INTO current_points
    FROM players
    WHERE telegram_id = p_telegram_id;

    -- Получаем новые очки из запроса
    new_points := COALESCE((p_data->>'airdrop_points')::INTEGER, current_points);

    -- ЗАЩИТА: Очки можно только увеличивать, не уменьшать
    IF new_points < current_points THEN
        RAISE NOTICE 'Попытка уменьшить airdrop_points: % -> %. Отклонено.', current_points, new_points;
        new_points := current_points;
    END IF;

    UPDATE players
    SET
        -- Basic data (BIGINT types)
        time_currency = COALESCE((p_data->>'time_currency')::BIGINT, time_currency),
        level = COALESCE((p_data->>'level')::BIGINT, level),
        experience = COALESCE((p_data->>'experience')::BIGINT, experience),
        faction = COALESCE(p_data->>'faction', faction),
        faction_changed = COALESCE((p_data->>'faction_changed')::BOOLEAN, faction_changed),

        -- JSONB fields
        wizards = COALESCE(p_data->'wizards', wizards),
        formation = COALESCE(p_data->'formation', formation),
        spells = COALESCE(p_data->'spells', spells),
        buildings = COALESCE(p_data->'buildings', buildings),
        pve_progress = COALESCE(p_data->'pve_progress', pve_progress),
        settings = COALESCE(p_data->'settings', settings),
        daily_login = COALESCE(p_data->'daily_login', daily_login),
        battle_energy = COALESCE(p_data->'battle_energy', battle_energy),
        purchased_packs = COALESCE(p_data->'purchased_packs', purchased_packs),

        -- Stats
        total_battles = COALESCE((p_data->>'total_battles')::INTEGER, total_battles),
        wins = COALESCE((p_data->>'wins')::INTEGER, wins),
        losses = COALESCE((p_data->>'losses')::INTEGER, losses),
        rating = COALESCE((p_data->>'rating')::INTEGER, rating),

        -- Blessing (JSONB and BIGINT types)
        active_blessing = COALESCE(p_data->'active_blessing', active_blessing),
        blessing_last_used = COALESCE((p_data->>'blessing_last_used')::BIGINT, blessing_last_used),

        -- Airdrop и кошелек (ЗАЩИТА: очки только растут)
        airdrop_points = new_points,
        wallet_address = COALESCE(p_data->>'wallet_address', wallet_address),
        wallet_connected_at = COALESCE((p_data->>'wallet_connected_at')::TIMESTAMPTZ, wallet_connected_at),

        -- Other
        welcome_shown = COALESCE((p_data->>'welcome_shown')::BOOLEAN, welcome_shown),
        last_login = COALESCE((p_data->>'last_login')::TIMESTAMPTZ, NOW())
    WHERE telegram_id = p_telegram_id;

    -- Логируем изменение очков для аудита
    IF new_points != current_points THEN
        RAISE NOTICE 'Airdrop points updated: % -> % (telegram_id: %)', current_points, new_points, p_telegram_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Комментарий
COMMENT ON FUNCTION update_player_safe(bigint, jsonb) IS 'Безопасное обновление данных игрока. Airdrop points защищены от уменьшения.';
