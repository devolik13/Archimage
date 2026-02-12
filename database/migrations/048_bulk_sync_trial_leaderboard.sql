DO $$
DECLARE
    v_week_year text := get_current_week_year();
    v_synced int := 0;
    v_skipped int := 0;
    r record;
BEGIN
    RAISE NOTICE 'Sync trial for week: %', v_week_year;

    FOR r IN (
        SELECT
            p.telegram_id AS player_tid,
            p.username AS player_name,
            (p.training_dummy_progress->>'totalDamage')::int AS local_total,
            (p.training_dummy_progress->>'bestAttempt')::int AS local_best
        FROM players p
        WHERE p.training_dummy_progress IS NOT NULL
          AND (p.training_dummy_progress->>'totalDamage')::int > 0
          AND p.training_dummy_progress->>'weekNumber' = v_week_year
    )
    LOOP
        BEGIN
            INSERT INTO trial_leaderboard
                (player_id, player_name, week_year, best_damage, total_damage, attempts_count)
            VALUES
                (r.player_tid, r.player_name, v_week_year, r.local_best, r.local_total, 1)
            ON CONFLICT (player_id, week_year) DO UPDATE SET
                total_damage = GREATEST(trial_leaderboard.total_damage, EXCLUDED.total_damage),
                best_damage = GREATEST(trial_leaderboard.best_damage, EXCLUDED.best_damage),
                player_name = EXCLUDED.player_name,
                updated_at = now();

            v_synced := v_synced + 1;
        EXCEPTION WHEN OTHERS THEN
            v_skipped := v_skipped + 1;
        END;
    END LOOP;

    RAISE NOTICE 'Synced: %, skipped: %', v_synced, v_skipped;
END;
$$;
