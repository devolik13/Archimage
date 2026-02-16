-- 060_tournament_system.sql
-- Система чемпионатов (турниры на вылет)

-- Таблица турниров
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'registration',
    -- registration: игроки регистрируются
    -- locked: регистрация закрыта, формации зафиксированы
    -- in_progress: бои рассчитываются порционно
    -- completed: турнир завершён
    total_participants INTEGER DEFAULT 0,
    current_round INTEGER DEFAULT 0,
    total_rounds INTEGER DEFAULT 0,
    visible_round INTEGER DEFAULT 0, -- до какого раунда результаты видны игрокам
    created_by BIGINT, -- telegram_id админа
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Участники турнира с зафиксированными данными
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id BIGINT NOT NULL, -- telegram_id
    player_name TEXT,
    seed INTEGER, -- позиция в сетке (рандомная или по рейтингу)
    rating_at_registration INTEGER DEFAULT 0,
    locked_formation JSONB NOT NULL, -- [wizardId, null, wizardId, ...]
    locked_wizards JSONB NOT NULL, -- полный снапшот магов
    locked_spells JSONB NOT NULL, -- снапшот заклинаний
    locked_buildings JSONB, -- снапшот зданий (для бонусов башни магов и т.д.)
    eliminated_in_round INTEGER, -- null = ещё в турнире
    final_position INTEGER, -- итоговое место
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, player_id)
);

-- Матчи турнира
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    match_number INTEGER NOT NULL, -- позиция в раунде (0-based)

    -- Участники
    player1_id BIGINT, -- telegram_id (null = bye)
    player2_id BIGINT, -- telegram_id (null = bye)
    player1_name TEXT,
    player2_name TEXT,

    -- Бой 1: player1 атакует
    fight1_result TEXT, -- 'player1', 'player2', 'draw'
    fight1_log JSONB, -- текстовый лог боя (battleLog массив)
    fight1_summary JSONB, -- краткая сводка (урон, убийства, HP)

    -- Бой 2: player2 атакует
    fight2_result TEXT,
    fight2_log JSONB,
    fight2_summary JSONB,

    -- Итог матча
    winner_id BIGINT,
    match_status TEXT DEFAULT 'pending',
    -- pending: ещё не рассчитан
    -- calculated: рассчитан но не показан
    -- visible: видим для игроков

    calculated_at TIMESTAMPTZ,

    UNIQUE(tournament_id, round, match_number)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament
    ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_player
    ON tournament_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_round
    ON tournament_matches(tournament_id, round);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_players
    ON tournament_matches(tournament_id, player1_id, player2_id);
