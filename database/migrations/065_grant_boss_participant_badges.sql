-- Migration 065: Выдать значок участника рейда всем, кто бил босса 5 (Отродье Тьмы)
-- Значок event_boss_participant выдаётся всем игрокам из event_boss_damage для boss_id = 5

UPDATE players
SET badges = COALESCE(badges, '[]'::jsonb) || '["event_boss_participant"]'::jsonb
WHERE telegram_id IN (
    SELECT telegram_id FROM event_boss_damage WHERE boss_id = 5
)
AND NOT COALESCE(badges, '[]'::jsonb) @> '"event_boss_participant"'::jsonb;
