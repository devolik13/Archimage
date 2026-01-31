-- Добавляем CASCADE DELETE для trial_leaderboard
ALTER TABLE trial_leaderboard
    DROP CONSTRAINT IF EXISTS trial_leaderboard_player_id_fkey;

ALTER TABLE trial_leaderboard
    ADD CONSTRAINT trial_leaderboard_player_id_fkey
    FOREIGN KEY (player_id)
    REFERENCES players(telegram_id)
    ON DELETE CASCADE;

-- Удаление тестового пользователя с telegram_id = 12345678
DELETE FROM players WHERE telegram_id = 12345678;
