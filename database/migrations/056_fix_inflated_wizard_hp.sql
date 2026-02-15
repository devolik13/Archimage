-- Migration 056: Fix inflated wizard HP from battle multiplier stacking bug
-- Problem: Commit 9795cb2 stripped original_max_hp on save, causing
-- battle multipliers (tower, guild, blessing) to stack on each fight.
-- Some wizards ended up with max_hp 900+ instead of max 300 (lvl 40).
--
-- Fix: Recalculate max_hp = 100 * level_bonus for every wizard,
-- cap hp to new max_hp, reset original_max_hp to 100, clean blessingEffects.

UPDATE players
SET wizards = (
    SELECT jsonb_agg(
        w
        -- Remove runtime blessing fields
        - 'blessingEffects'
        - 'original_max_hp'
        -- Set correct max_hp based on level
        || jsonb_build_object(
            'max_hp', CASE
                WHEN COALESCE((w->>'level')::int, 1) = 40 THEN 300
                WHEN COALESCE((w->>'level')::int, 1) > 1
                    THEN floor(100 * (1 + (COALESCE((w->>'level')::int, 1) - 1) * 0.05))::int
                ELSE 100
            END,
            'hp', LEAST(
                COALESCE((w->>'hp')::int, 100),
                CASE
                    WHEN COALESCE((w->>'level')::int, 1) = 40 THEN 300
                    WHEN COALESCE((w->>'level')::int, 1) > 1
                        THEN floor(100 * (1 + (COALESCE((w->>'level')::int, 1) - 1) * 0.05))::int
                    ELSE 100
                END
            )
        )
    )
    FROM jsonb_array_elements(wizards) AS w
)
WHERE wizards IS NOT NULL
  AND jsonb_array_length(wizards) > 0
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(wizards) AS w
    WHERE COALESCE((w->>'max_hp')::int, 100) > CASE
        WHEN COALESCE((w->>'level')::int, 1) = 40 THEN 300
        WHEN COALESCE((w->>'level')::int, 1) > 1
            THEN floor(100 * (1 + (COALESCE((w->>'level')::int, 1) - 1) * 0.05))::int
        ELSE 100
    END
  );
