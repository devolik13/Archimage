-- Очищаем тестовые значки, которые были вручную присвоены telegram_id 12345678
UPDATE players
SET badges = '[]'::jsonb
WHERE telegram_id = 12345678
  AND badges IS NOT NULL
  AND badges != '[]'::jsonb;
