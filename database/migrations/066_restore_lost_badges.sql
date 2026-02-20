-- Migration 066: Фикс потери бейджей
-- 1. Создаём вспомогательную функцию jsonb_array_union для merge массивов
-- 2. Обновляем RPC update_player_safe: badges теперь MERGE (объединение), а не REPLACE
--    Это гарантирует что бейджи выданные миграциями/сервером не будут затёрты клиентом
-- 3. Восстанавливаем потерянные бейджи за босса 5

-- ========================================
-- 1. Вспомогательная функция: объединение двух jsonb массивов без дубликатов
-- ========================================
CREATE OR REPLACE FUNCTION jsonb_array_union(a JSONB, b JSONB)
RETURNS JSONB AS $$
    SELECT COALESCE(
        jsonb_agg(DISTINCT val),
        '[]'::jsonb
    )
    FROM (
        SELECT val FROM jsonb_array_elements(COALESCE(a, '[]'::jsonb)) AS val
        UNION
        SELECT val FROM jsonb_array_elements(COALESCE(b, '[]'::jsonb)) AS val
    ) combined;
$$ LANGUAGE sql IMMUTABLE;

-- ========================================
-- 2. Обновляем RPC: badges = UNION(серверные, клиентские)
-- ========================================
CREATE OR REPLACE FUNCTION update_player_safe(p_telegram_id BIGINT, p_data JSONB)
RETURNS VOID AS $$
DECLARE
    current_points INTEGER;
    new_points INTEGER;
BEGIN
    -- Anti-cheat: airdrop_points can only increase
    SELECT airdrop_points
    INTO current_points
    FROM players WHERE telegram_id = p_telegram_id;

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
        formation_presets = CASE
            WHEN p_data ? 'formation_presets' AND p_data->'formation_presets' IS NOT NULL
            THEN p_data->'formation_presets'
            ELSE formation_presets
        END,
        buildings = CASE
            WHEN p_data ? 'buildings' AND p_data->'buildings' IS NOT NULL
            THEN p_data->'buildings'
            ELSE buildings
        END,
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
        -- BADGES: MERGE вместо REPLACE — объединяем серверные + клиентские без дубликатов
        badges = CASE
            WHEN p_data ? 'badges' AND p_data->'badges' IS NOT NULL
            THEN jsonb_array_union(badges, p_data->'badges')
            ELSE badges
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

-- ========================================
-- 3. Восстанавливаем потерянные бейджи за босса 5
-- ========================================

-- Значок участника рейда — ВСЕМ кто бил босса
UPDATE players
SET badges = COALESCE(badges, '[]'::jsonb) || '["event_boss_participant"]'::jsonb
WHERE telegram_id IN (
    SELECT telegram_id FROM event_boss_damage WHERE boss_id = 5
)
AND NOT COALESCE(badges, '[]'::jsonb) @> '"event_boss_participant"'::jsonb;

-- Топ-1: Hahauzik
UPDATE players SET badges = COALESCE(badges, '[]'::jsonb) || '["event_boss_top1"]'::jsonb
WHERE telegram_id = 7278693941
  AND NOT COALESCE(badges, '[]'::jsonb) @> '"event_boss_top1"'::jsonb;

-- Топ-2: xOd1SoN
UPDATE players SET badges = COALESCE(badges, '[]'::jsonb) || '["event_boss_top2"]'::jsonb
WHERE telegram_id = 885403078
  AND NOT COALESCE(badges, '[]'::jsonb) @> '"event_boss_top2"'::jsonb;

-- Топ-3: suraONEx
UPDATE players SET badges = COALESCE(badges, '[]'::jsonb) || '["event_boss_top3"]'::jsonb
WHERE telegram_id = 258081382
  AND NOT COALESCE(badges, '[]'::jsonb) @> '"event_boss_top3"'::jsonb;

-- Контрольный удар: ViBE_ViBE
UPDATE players SET badges = COALESCE(badges, '[]'::jsonb) || '["event_boss_finisher"]'::jsonb
WHERE telegram_id = 406936302
  AND NOT COALESCE(badges, '[]'::jsonb) @> '"event_boss_finisher"'::jsonb;
