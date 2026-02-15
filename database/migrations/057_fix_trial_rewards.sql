-- ============================================
-- Migration 057: Fix trial reward system (2 bugs)
--
-- Bug 1: auto_claim_trial_reward updates time_currency directly instead of
--         using add_time_currency(). Lazy time currency system overwrites
--         the reward on next snapshot.
--
-- Bug 2: sync_trial_total writes telegram_id into trial_leaderboard.player_id
--         instead of converting to players.id first.
--
-- NOTE: 10000 minimum participants for rewards is intentional (league system).
-- ============================================

-- ============================================
-- FIX 1: auto_claim_trial_reward — use add_time_currency()
-- ============================================
CREATE OR REPLACE FUNCTION auto_claim_trial_reward(p_player_id bigint, p_week_year text)
RETURNS TABLE (
    success boolean,
    rank bigint,
    total_players bigint,
    percent float,
    best_damage int,
    reward_time int,
    message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result RECORD;
    v_already_claimed boolean;
    v_internal_player_id INTEGER;
BEGIN
    -- Получаем внутренний id игрока по telegram_id
    SELECT id INTO v_internal_player_id
    FROM players
    WHERE telegram_id = p_player_id;

    IF v_internal_player_id IS NULL THEN
        RETURN QUERY SELECT
            false::boolean, 0::bigint, 0::bigint, 0::float, 0::int, 0::int,
            'Игрок не найден'::text;
        RETURN;
    END IF;

    -- Проверяем, не получена ли уже награда за эту неделю
    SELECT EXISTS(
        SELECT 1 FROM trial_rewards
        WHERE player_id = v_internal_player_id AND week_year = p_week_year
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
        RETURN QUERY SELECT
            false::boolean, 0::bigint, 0::bigint, 0::float, 0::int, 0::int,
            'Награда уже получена'::text;
        RETURN;
    END IF;

    -- Получаем результат игрока за неделю
    SELECT * INTO v_result FROM get_player_week_result(v_internal_player_id, p_week_year);

    IF v_result IS NULL OR v_result.rank IS NULL THEN
        RETURN QUERY SELECT
            false::boolean, 0::bigint, 0::bigint, 0::float, 0::int, 0::int,
            'Нет результатов за эту неделю'::text;
        RETURN;
    END IF;

    -- Не начисляем если reward_time = 0
    IF v_result.reward_time <= 0 THEN
        RETURN QUERY SELECT
            false::boolean, v_result.rank, v_result.total_players, v_result.percent,
            v_result.best_damage, 0::int,
            'Нет награды за эту неделю'::text;
        RETURN;
    END IF;

    -- ИСПРАВЛЕНО: используем add_time_currency вместо прямого UPDATE
    -- Это корректно работает с lazy time currency системой
    PERFORM add_time_currency(p_player_id, v_result.reward_time);

    -- Записываем что награда получена
    INSERT INTO trial_rewards (player_id, week_year, rank_position, rank_percent, reward_tier, reward_time, claimed, claimed_at)
    VALUES (
        v_internal_player_id,
        p_week_year,
        v_result.rank,
        v_result.percent,
        CASE
            WHEN v_result.percent <= 1 THEN 'legendary'
            WHEN v_result.percent <= 5 THEN 'epic'
            WHEN v_result.percent <= 10 THEN 'rare'
            WHEN v_result.percent <= 25 THEN 'uncommon'
            WHEN v_result.percent <= 50 THEN 'common'
            ELSE 'participation'
        END,
        v_result.reward_time,
        true,
        now()
    );

    RETURN QUERY SELECT
        true::boolean,
        v_result.rank,
        v_result.total_players,
        v_result.percent,
        v_result.best_damage,
        v_result.reward_time,
        'Награда начислена!'::text;
END;
$$;

-- ============================================
-- FIX 3: sync_trial_total — convert telegram_id → players.id
-- ============================================
CREATE OR REPLACE FUNCTION sync_trial_total(
    p_player_id bigint,
    p_player_name text,
    p_total_damage int,
    p_best_damage int,
    p_attempts_count int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_week_year text;
    v_internal_player_id INTEGER;
BEGIN
    v_week_year := get_current_week_year();

    -- ИСПРАВЛЕНО: конвертируем telegram_id → players.id
    SELECT id INTO v_internal_player_id
    FROM players
    WHERE telegram_id = p_player_id;

    IF v_internal_player_id IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO trial_leaderboard (player_id, player_name, week_year, best_damage, total_damage, attempts_count)
    VALUES (v_internal_player_id, p_player_name, v_week_year, p_best_damage, p_total_damage, p_attempts_count)
    ON CONFLICT (player_id, week_year) DO UPDATE SET
        total_damage = GREATEST(trial_leaderboard.total_damage, EXCLUDED.total_damage),
        best_damage = GREATEST(trial_leaderboard.best_damage, EXCLUDED.best_damage),
        attempts_count = GREATEST(trial_leaderboard.attempts_count, EXCLUDED.attempts_count),
        player_name = EXCLUDED.player_name,
        updated_at = now();
END;
$$;

-- ============================================
-- CLEANUP: Удалить записи где player_id = telegram_id (мусор от старого sync_trial_total)
-- Они не ссылаются на реальный players.id
-- ============================================
DELETE FROM trial_leaderboard
WHERE player_id > 1000000
  AND NOT EXISTS (SELECT 1 FROM players WHERE players.id = trial_leaderboard.player_id);

-- ============================================
COMMENT ON FUNCTION get_player_week_result IS 'Результат игрока за неделю. Награда за лигу только при 10000+ участников';
COMMENT ON FUNCTION auto_claim_trial_reward IS 'Авто-начисление награды за прошлую неделю. Использует add_time_currency для корректной работы с lazy system';
COMMENT ON FUNCTION sync_trial_total IS 'Синхронизация прогресса испытания. Конвертирует telegram_id → players.id';
