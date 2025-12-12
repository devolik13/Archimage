-- Migration 019: Add CASCADE DELETE to foreign keys referencing players
-- Позволяет удалять игрока со всеми связанными данными одним действием

-- 1. Payments table - удалить старый FK и добавить с CASCADE
ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS payments_telegram_id_fkey;

ALTER TABLE payments
    ADD CONSTRAINT payments_telegram_id_fkey
    FOREIGN KEY (telegram_id)
    REFERENCES players(telegram_id)
    ON DELETE CASCADE;

-- 2. Referrals table (если существует) - добавляем CASCADE для обеих ссылок
DO $$
BEGIN
    -- Проверяем существование таблицы referrals
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'referrals') THEN
        -- Удаляем существующие FK если есть
        ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_referrer_telegram_id_fkey;
        ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_referred_telegram_id_fkey;
        ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_referrer_id_fkey;
        ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_referred_id_fkey;

        -- Добавляем FK с CASCADE (проверяем какие колонки существуют)
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'referrer_telegram_id') THEN
            ALTER TABLE referrals
                ADD CONSTRAINT referrals_referrer_telegram_id_fkey
                FOREIGN KEY (referrer_telegram_id)
                REFERENCES players(telegram_id)
                ON DELETE CASCADE;
        END IF;

        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'referred_telegram_id') THEN
            ALTER TABLE referrals
                ADD CONSTRAINT referrals_referred_telegram_id_fkey
                FOREIGN KEY (referred_telegram_id)
                REFERENCES players(telegram_id)
                ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Комментарий
COMMENT ON CONSTRAINT payments_telegram_id_fkey ON payments IS 'CASCADE DELETE - удаление игрока удаляет все его платежи';
