-- Migration 058: Clean stacked combat fields from wizard data
-- Bug: Dawn spell wrote damageMultiplier/buffs onto wizard objects,
-- which persisted to DB and stacked +30% damage per battle played.
-- After 7 battles a wizard could have +210% damage.

UPDATE players
SET wizards = (
    SELECT jsonb_agg(
        w - 'damageMultiplier' - 'buffs' - 'effects' - 'spellDamageMultiplier' - 'armorBonus'
    )
    FROM jsonb_array_elements(wizards) AS w
)
WHERE wizards IS NOT NULL
  AND jsonb_array_length(wizards) > 0
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(wizards) AS w
    WHERE w ? 'damageMultiplier' OR w ? 'buffs' OR w ? 'effects' OR w ? 'spellDamageMultiplier' OR w ? 'armorBonus'
  );
