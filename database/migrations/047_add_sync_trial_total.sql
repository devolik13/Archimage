-- ============================================
-- Функция синхронизации прогресса испытаний
-- Используется для подтягивания локальных данных в Supabase
-- если saveTrialResultSupabase не срабатывал из-за сети/инициализации
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

    -- Конвертируем telegram_id в внутренний player_id
    SELECT id INTO v_internal_player_id FROM players WHERE telegram_id = p_player_id;
    IF v_internal_player_id IS NULL THEN RETURN; END IF;

    -- Вставляем или обновляем запись, используя GREATEST чтобы не потерять данные
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

COMMENT ON FUNCTION sync_trial_total IS 'Синхронизирует локальный прогресс испытания с БД (GREATEST — данные не теряются)';
