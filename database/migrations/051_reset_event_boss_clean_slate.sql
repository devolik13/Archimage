-- Migration 051: Reset event boss data for clean slate before live event
-- Clears ALL test data: boss HP, player damage, attempts, badges

-- ============================================
-- STEP 1: Delete all test damage records (resets attempts, damage, leaderboard)
-- ============================================
DELETE FROM event_boss_damage;

-- ============================================
-- STEP 2: Delete all test bosses
-- ============================================
DELETE FROM event_bosses;

-- ============================================
-- STEP 3: Clear event boss badges from all players
-- ============================================
UPDATE players
SET badges = (
    SELECT COALESCE(jsonb_agg(b), '[]'::jsonb)
    FROM jsonb_array_elements(badges) AS b
    WHERE b::text NOT LIKE '%event_boss%'
)
WHERE badges IS NOT NULL
  AND badges::text LIKE '%event_boss%';

-- ============================================
-- STEP 4: Create fresh boss for live event
-- Start: 2026-02-14 09:00 UTC (12:00 MSK)
-- Duration: 168 hours (1 week)
-- ============================================
INSERT INTO event_bosses (name, max_hp, current_hp, config, rewards, starts_at, ends_at, status)
VALUES (
    'Отродье Тьмы',
    5000000,
    5000000,
    '{
        "faction": "dark",
        "spells": ["epidemic", "plague", "foul_cloud", "shadow_realm", "fading"],
        "spell_levels": {"epidemic": 8, "plague": 8, "foul_cloud": 8, "shadow_realm": 8, "fading": 8},
        "resistances": {"fire": 40, "water": 40, "wind": 40, "earth": 40, "nature": 40, "poison": 75, "light": 0, "dark": 75},
        "battleHp": 999999,
        "battleArmor": 150,
        "damageMultiplier": 2.0,
        "poisonImmune": true
    }'::jsonb,
    '{
        "participation": {"timeCurrency": 1440},
        "top1": {"timeCurrency": 28800},
        "top2": {"timeCurrency": 14400},
        "top3": {"timeCurrency": 7200},
        "bossKilled": {"timeCurrency": 4320},
        "finishingBlow": {"timeCurrency": 10080}
    }'::jsonb,
    '2026-02-14 09:00:00+00'::timestamptz,
    '2026-02-14 09:00:00+00'::timestamptz + INTERVAL '168 hours',
    'active'
);
