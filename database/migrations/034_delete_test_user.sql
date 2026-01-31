-- Удаление тестового пользователя с telegram_id = 12345678
-- CASCADE DELETE автоматически удалит связанные записи (payments, referrals и т.д.)
DELETE FROM players WHERE telegram_id = 12345678;
