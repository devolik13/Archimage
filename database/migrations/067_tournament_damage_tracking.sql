-- 067_tournament_damage_tracking.sql
-- Добавляем колонки суммарного урона для определения победителя при ничьей 1:1

-- Суммарный урон игрока 1 за бой 1 (player1 атакует)
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS fight1_p1_damage INTEGER DEFAULT 0;
-- Суммарный урон игрока 2 за бой 1 (player2 защищается)
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS fight1_p2_damage INTEGER DEFAULT 0;

-- Суммарный урон игрока 2 за бой 2 (player2 атакует)
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS fight2_p1_damage INTEGER DEFAULT 0;
-- Суммарный урон игрока 1 за бой 2 (player1 защищается)
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS fight2_p2_damage INTEGER DEFAULT 0;

-- Итоговый суммарный урон каждого игрока за оба боя
-- p1_total_damage = fight1_p1_damage + fight2_p1_damage
-- p2_total_damage = fight1_p2_damage + fight2_p2_damage
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS p1_total_damage INTEGER DEFAULT 0;
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS p2_total_damage INTEGER DEFAULT 0;

-- Причина победы: 'wins' (больше побед), 'damage' (по урону при 1:1), 'random' (полная ничья)
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS win_reason TEXT;

COMMENT ON COLUMN tournament_matches.p1_total_damage IS 'Суммарный урон игрока 1 за оба боя';
COMMENT ON COLUMN tournament_matches.p2_total_damage IS 'Суммарный урон игрока 2 за оба боя';
COMMENT ON COLUMN tournament_matches.win_reason IS 'Причина победы: wins (по победам), damage (по урону при 1:1), random (полная ничья)';
