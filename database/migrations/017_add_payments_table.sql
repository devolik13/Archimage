-- Migration 017: Add payments table for Telegram Stars
-- Таблица для отслеживания платежей через Telegram Stars

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL REFERENCES players(telegram_id),
    product_id TEXT NOT NULL,
    amount_stars INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
    payload TEXT, -- JSON payload для отслеживания
    invoice_url TEXT,
    telegram_payment_id TEXT, -- ID платежа от Telegram
    target_faction TEXT, -- Для смены фракции
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Индексы
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_payments_telegram_id ON payments(telegram_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_telegram_payment_id ON payments(telegram_payment_id) WHERE telegram_payment_id IS NOT NULL;

-- Комментарии
COMMENT ON TABLE payments IS 'История платежей Telegram Stars';
COMMENT ON COLUMN payments.telegram_id IS 'ID пользователя Telegram';
COMMENT ON COLUMN payments.product_id IS 'ID товара (time_pack_small, starter_pack_medium, etc)';
COMMENT ON COLUMN payments.amount_stars IS 'Сумма в Telegram Stars';
COMMENT ON COLUMN payments.status IS 'Статус платежа: pending, completed, failed, refunded';
COMMENT ON COLUMN payments.payload IS 'JSON данные для отслеживания платежа';
COMMENT ON COLUMN payments.telegram_payment_id IS 'ID успешного платежа от Telegram';

-- Функция для получения статистики покупок игрока
CREATE OR REPLACE FUNCTION get_player_purchases(p_telegram_id BIGINT)
RETURNS TABLE(
    total_spent INTEGER,
    purchase_count INTEGER,
    last_purchase TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(amount_stars), 0)::INTEGER as total_spent,
        COUNT(*)::INTEGER as purchase_count,
        MAX(completed_at) as last_purchase
    FROM payments
    WHERE telegram_id = p_telegram_id AND status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- RLS политики
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Пользователь может видеть только свои платежи
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (telegram_id = current_setting('app.current_user_id', true)::BIGINT);

-- Только сервис может вставлять/обновлять платежи
CREATE POLICY "Service can manage payments" ON payments
    FOR ALL USING (true) WITH CHECK (true);
