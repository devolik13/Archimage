-- Migration 016: Add Season System for PVP Ladder
-- Adds season tracking and league rewards

-- Add season fields to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS current_season INTEGER DEFAULT 1;
ALTER TABLE players ADD COLUMN IF NOT EXISTS season_league_rewards_claimed TEXT[] DEFAULT '{}';

-- Add global season configuration table
CREATE TABLE IF NOT EXISTS season_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    current_season INTEGER NOT NULL DEFAULT 1,
    season_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    season_end_date TIMESTAMPTZ,
    CHECK (id = 1) -- Только одна строка в таблице
);

-- Insert initial season config if not exists
INSERT INTO season_config (id, current_season, season_start_date)
VALUES (1, 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- Update RPC function to include season fields
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
        gold = COALESCE((p_data->>'gold')::INTEGER, gold),
        crystals = COALESCE((p_data->>'crystals')::INTEGER, crystals),
        rating = COALESCE((p_data->>'rating')::INTEGER, rating),
        wins = COALESCE((p_data->>'wins')::INTEGER, wins),
        losses = COALESCE((p_data->>'losses')::INTEGER, losses),
        total_battles = COALESCE((p_data->>'total_battles')::INTEGER, total_battles),
        faction = COALESCE(p_data->>'faction', faction),
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
        daily_streak = CASE
            WHEN p_data ? 'daily_streak' AND p_data->'daily_streak' IS NOT NULL
            THEN p_data->'daily_streak'
            ELSE daily_streak
        END,
        -- Season fields
        current_season = COALESCE((p_data->>'current_season')::INTEGER, current_season),
        season_league_rewards_claimed = CASE
            WHEN p_data ? 'season_league_rewards_claimed' AND p_data->'season_league_rewards_claimed' IS NOT NULL
            THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'season_league_rewards_claimed'))
            ELSE season_league_rewards_claimed
        END,
        updated_at = NOW()
    WHERE telegram_id = p_telegram_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current season info
CREATE OR REPLACE FUNCTION get_current_season()
RETURNS TABLE(season INTEGER, start_date TIMESTAMPTZ, end_date TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY SELECT current_season, season_start_date, season_end_date FROM season_config WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- Function to start new season (admin only - будет вызываться вручную или по расписанию)
CREATE OR REPLACE FUNCTION start_new_season(p_new_season_number INTEGER DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_new_season INTEGER;
BEGIN
    -- Определяем номер нового сезона
    v_new_season := COALESCE(p_new_season_number, (SELECT current_season + 1 FROM season_config WHERE id = 1));

    -- Обновляем конфиг сезона
    UPDATE season_config
    SET
        current_season = v_new_season,
        season_start_date = NOW(),
        season_end_date = NULL
    WHERE id = 1;

    -- Сбрасываем рейтинг всех игроков (soft reset: 50% + 500)
    UPDATE players
    SET
        rating = GREATEST(500, (rating / 2) + 500),
        current_season = v_new_season,
        season_league_rewards_claimed = '{}';

    RAISE NOTICE 'Сезон % начат. Рейтинг всех игроков сброшен.', v_new_season;
END;
$$ LANGUAGE plpgsql;

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_players_current_season ON players(current_season);
CREATE INDEX IF NOT EXISTS idx_players_rating_season ON players(rating DESC, current_season);

COMMENT ON COLUMN players.current_season IS 'Текущий сезон игрока';
COMMENT ON COLUMN players.season_league_rewards_claimed IS 'Массив ID лиг, за которые игрок получил награды в текущем сезоне';
COMMENT ON TABLE season_config IS 'Глобальная конфигурация сезонов PVP';
COMMENT ON FUNCTION get_current_season() IS 'Получить информацию о текущем сезоне';
COMMENT ON FUNCTION start_new_season(INTEGER) IS 'Начать новый сезон с сбросом рейтинга';
