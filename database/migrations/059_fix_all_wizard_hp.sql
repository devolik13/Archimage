-- Migration 059: Fix ALL wizard HP mismatches (both inflated and too low)
-- Previous migration 056 only fixed inflated HP (max_hp > expected).
-- This also fixes wizards with too low HP and cleans combat fields (058).

UPDATE players
SET wizards = (
    SELECT jsonb_agg(
        w
        -- Remove runtime/combat fields
        - 'blessingEffects'
        - 'original_max_hp'
        - 'damageMultiplier'
        - 'buffs'
        - 'effects'
        - 'spellDamageMultiplier'
        - 'armorBonus'
        -- Set correct max_hp and cap hp
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
    WHERE COALESCE((w->>'max_hp')::int, 0) != CASE
        WHEN COALESCE((w->>'level')::int, 1) = 40 THEN 300
        WHEN COALESCE((w->>'level')::int, 1) > 1
            THEN floor(100 * (1 + (COALESCE((w->>'level')::int, 1) - 1) * 0.05))::int
        ELSE 100
    END
    OR w ? 'damageMultiplier'
    OR w ? 'buffs'
    OR w ? 'effects'
    OR w ? 'spellDamageMultiplier'
    OR w ? 'armorBonus'
    OR w ? 'blessingEffects'
    OR w ? 'original_max_hp'
  );
