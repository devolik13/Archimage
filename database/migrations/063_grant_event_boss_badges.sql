-- Migration 063: Выдать значки за ивент-босса "Отродье Тьмы" (февраль 2026)
-- Значки выдаются вручную, т.к. клиентская логика не сработала для всех игроков

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
