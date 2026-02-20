-- Migration 066: Восстановить потерянные бейджи за босса 5
-- Баг: автосейв (startAutoSave / setupBeforeUnload) не включал badges в playerData,
-- поэтому savePlayer() отправлял badges: [] и затирал бейджи при каждом сохранении.
-- Фикс в db-manager.js: добавлен badges в оба места автосейва.

-- 1. Значок участника рейда — ВСЕМ кто бил босса
UPDATE players
SET badges = COALESCE(badges, '[]'::jsonb) || '["event_boss_participant"]'::jsonb
WHERE telegram_id IN (
    SELECT telegram_id FROM event_boss_damage WHERE boss_id = 5
)
AND NOT COALESCE(badges, '[]'::jsonb) @> '"event_boss_participant"'::jsonb;

-- 2. Топ-1: Hahauzik
UPDATE players SET badges = COALESCE(badges, '[]'::jsonb) || '["event_boss_top1"]'::jsonb
WHERE telegram_id = 7278693941
  AND NOT COALESCE(badges, '[]'::jsonb) @> '"event_boss_top1"'::jsonb;

-- 3. Топ-2: xOd1SoN
UPDATE players SET badges = COALESCE(badges, '[]'::jsonb) || '["event_boss_top2"]'::jsonb
WHERE telegram_id = 885403078
  AND NOT COALESCE(badges, '[]'::jsonb) @> '"event_boss_top2"'::jsonb;

-- 4. Топ-3: suraONEx
UPDATE players SET badges = COALESCE(badges, '[]'::jsonb) || '["event_boss_top3"]'::jsonb
WHERE telegram_id = 258081382
  AND NOT COALESCE(badges, '[]'::jsonb) @> '"event_boss_top3"'::jsonb;

-- 5. Контрольный удар: ViBE_ViBE
UPDATE players SET badges = COALESCE(badges, '[]'::jsonb) || '["event_boss_finisher"]'::jsonb
WHERE telegram_id = 406936302
  AND NOT COALESCE(badges, '[]'::jsonb) @> '"event_boss_finisher"'::jsonb;
