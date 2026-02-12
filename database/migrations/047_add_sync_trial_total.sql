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
BEGIN
    v_week_year := get_current_week_year();

    -- p_player_id = telegram_id (FK trial_leaderboard -> players.telegram_id)
    IF NOT EXISTS (SELECT 1 FROM players WHERE telegram_id = p_player_id) THEN
        RETURN;
    END IF;

    INSERT INTO trial_leaderboard (player_id, player_name, week_year, best_damage, total_damage, attempts_count)
    VALUES (p_player_id, p_player_name, v_week_year, p_best_damage, p_total_damage, p_attempts_count)
    ON CONFLICT (player_id, week_year) DO UPDATE SET
        total_damage = GREATEST(trial_leaderboard.total_damage, EXCLUDED.total_damage),
        best_damage = GREATEST(trial_leaderboard.best_damage, EXCLUDED.best_damage),
        attempts_count = GREATEST(trial_leaderboard.attempts_count, EXCLUDED.attempts_count),
        player_name = EXCLUDED.player_name,
        updated_at = now();
END;
$$;
