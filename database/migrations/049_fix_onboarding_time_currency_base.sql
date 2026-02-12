-- Migration 049: Fix players who registered with time_currency but without time_currency_base
-- Bug: onboarding.js set time_currency=7200 but not time_currency_base, so lazy accrual
-- system (get_time_currency) reads base=0 and the initial 7200 minutes are lost.
--
-- Fix: For players where time_currency > time_currency_base (likely affected by this bug),
-- update time_currency_base to match time_currency so they don't lose their balance.

UPDATE players
SET
    time_currency_base = time_currency,
    time_currency_updated_at = now()
WHERE time_currency > COALESCE(time_currency_base, 0)
  AND COALESCE(time_currency_base, 0) = 0
  AND time_currency > 0;
