-- Migration 020: Create referrals table
-- Таблица для реферальной системы

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Кто пригласил
    referrer_id UUID REFERENCES players(id) ON DELETE SET NULL,
    referrer_telegram_id BIGINT NOT NULL,

    -- Кого пригласили
    referred_id UUID REFERENCES players(id) ON DELETE CASCADE,
    referred_telegram_id BIGINT NOT NULL,

    -- Награда
    reward_amount INTEGER NOT NULL DEFAULT 1440, -- Минуты времени (1 день = 1440)
    reward_claimed BOOLEAN DEFAULT true, -- Уже начислено при регистрации

    -- Статистика (для бонусов за покупки)
    total_purchase_bonus INTEGER DEFAULT 0, -- Сколько BPM coin получил реферер от покупок

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Уникальность: один игрок может быть приглашён только один раз
    CONSTRAINT unique_referred UNIQUE (referred_telegram_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_telegram_id ON referrals(referrer_telegram_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_telegram_id ON referrals(referred_telegram_id);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);

-- Комментарии
COMMENT ON TABLE referrals IS 'История реферальных приглашений';
COMMENT ON COLUMN referrals.referrer_id IS 'UUID игрока, который пригласил';
COMMENT ON COLUMN referrals.referrer_telegram_id IS 'Telegram ID пригласившего';
COMMENT ON COLUMN referrals.referred_id IS 'UUID приглашённого игрока';
COMMENT ON COLUMN referrals.referred_telegram_id IS 'Telegram ID приглашённого';
COMMENT ON COLUMN referrals.reward_amount IS 'Награда в минутах времени';
COMMENT ON COLUMN referrals.total_purchase_bonus IS 'Сумма бонусов от покупок приглашённого';

-- Функция для подсчёта рефералов игрока
CREATE OR REPLACE FUNCTION get_referral_stats(p_player_id UUID)
RETURNS TABLE(
    referral_count INTEGER,
    total_time_earned INTEGER,
    total_purchase_bonus INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as referral_count,
        COALESCE(SUM(reward_amount), 0)::INTEGER as total_time_earned,
        COALESCE(SUM(r.total_purchase_bonus), 0)::INTEGER as total_purchase_bonus
    FROM referrals r
    WHERE r.referrer_id = p_player_id;
END;
$$ LANGUAGE plpgsql;

-- Функция для подсчёта рефералов по telegram_id
CREATE OR REPLACE FUNCTION get_referral_count_by_telegram(p_telegram_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    result INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO result
    FROM referrals
    WHERE referrer_telegram_id = p_telegram_id;

    RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql;

-- RLS политики
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Пользователь может видеть рефералов где он referrer или referred
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (
        referrer_telegram_id = current_setting('app.current_user_id', true)::BIGINT
        OR referred_telegram_id = current_setting('app.current_user_id', true)::BIGINT
    );

-- Сервис может управлять всеми записями
CREATE POLICY "Service can manage referrals" ON referrals
    FOR ALL USING (true) WITH CHECK (true);

-- Грантим права
GRANT SELECT, INSERT, UPDATE ON referrals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON referrals TO anon;
