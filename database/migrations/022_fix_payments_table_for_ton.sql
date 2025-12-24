-- Migration 022: Fix payments table to support TON payments
-- Adds missing columns for TON payment support

-- 1. Make amount_stars nullable (TON payments don't have stars)
ALTER TABLE payments ALTER COLUMN amount_stars DROP NOT NULL;

-- 2. Add new columns for TON and payment method
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_ton DECIMAL(20, 9); -- TON amount (9 decimals)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stars'; -- 'stars' or 'ton'
ALTER TABLE payments ADD COLUMN IF NOT EXISTS ton_transaction_hash TEXT; -- BOC hash from TON transaction

-- 3. Add constraint for payment method
ALTER TABLE payments DROP CONSTRAINT IF EXISTS valid_payment_method;
ALTER TABLE payments ADD CONSTRAINT valid_payment_method
    CHECK (payment_method IN ('stars', 'ton'));

-- 4. Add index for TON transactions
CREATE INDEX IF NOT EXISTS idx_payments_ton_hash ON payments(ton_transaction_hash)
    WHERE ton_transaction_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);

-- 5. Update comments
COMMENT ON COLUMN payments.amount_stars IS 'Сумма в Telegram Stars (NULL для TON платежей)';
COMMENT ON COLUMN payments.amount_ton IS 'Сумма в TON (NULL для Stars платежей)';
COMMENT ON COLUMN payments.payment_method IS 'Способ оплаты: stars или ton';
COMMENT ON COLUMN payments.ton_transaction_hash IS 'Хеш TON транзакции (BOC)';

-- 6. Update get_player_purchases to include TON
-- Сначала удаляем старую функцию (изменился тип возврата)
DROP FUNCTION IF EXISTS get_player_purchases(BIGINT);

CREATE OR REPLACE FUNCTION get_player_purchases(p_telegram_id BIGINT)
RETURNS TABLE(
    total_spent_stars INTEGER,
    total_spent_ton DECIMAL(20, 9),
    purchase_count INTEGER,
    last_purchase TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(amount_stars), 0)::INTEGER as total_spent_stars,
        COALESCE(SUM(amount_ton), 0) as total_spent_ton,
        COUNT(*)::INTEGER as purchase_count,
        MAX(completed_at) as last_purchase
    FROM payments
    WHERE telegram_id = p_telegram_id AND status = 'completed';
END;
$$ LANGUAGE plpgsql;
