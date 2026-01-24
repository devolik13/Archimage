-- 032: Добавление колонки для отслеживания награды за вступление в группу
-- Награда: 500 BPM + 2 дня времени (одноразово)

-- Добавляем колонку group_reward_claimed
ALTER TABLE players
ADD COLUMN IF NOT EXISTS group_reward_claimed BOOLEAN DEFAULT FALSE;

-- Комментарий
COMMENT ON COLUMN players.group_reward_claimed IS 'Получена ли награда за вступление в группу @archimage_chat';

-- Индекс для быстрого поиска тех, кто еще не получил награду (для аналитики)
CREATE INDEX IF NOT EXISTS idx_players_group_reward
ON players(group_reward_claimed)
WHERE group_reward_claimed = FALSE;
