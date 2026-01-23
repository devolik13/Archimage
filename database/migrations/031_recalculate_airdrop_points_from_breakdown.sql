-- Migration 031: Recalculate airdrop_points from airdrop_breakdown
-- Problem: airdrop_points was not being saved properly, but airdrop_breakdown accumulated correctly
-- Solution: Recalculate airdrop_points as sum of all values in airdrop_breakdown

-- Function to calculate sum of JSONB object values
CREATE OR REPLACE FUNCTION sum_jsonb_values(data JSONB)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER := 0;
    val INTEGER;
BEGIN
    IF data IS NULL OR data = '{}'::jsonb THEN
        RETURN 0;
    END IF;

    FOR val IN SELECT (value::text)::integer FROM jsonb_each(data)
    LOOP
        total := total + COALESCE(val, 0);
    END LOOP;

    RETURN total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all players: set airdrop_points to MAX of current value and sum of breakdown
-- This ensures we never decrease points, only fix those that are too low
UPDATE players
SET airdrop_points = GREATEST(
    COALESCE(airdrop_points, 0),
    sum_jsonb_values(COALESCE(airdrop_breakdown, '{}'::jsonb))
)
WHERE airdrop_breakdown IS NOT NULL
  AND airdrop_breakdown != '{}'::jsonb;

-- Log the results
DO $$
DECLARE
    updated_count INTEGER;
    total_fixed INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM players
    WHERE airdrop_breakdown IS NOT NULL
      AND airdrop_breakdown != '{}'::jsonb
      AND airdrop_points < sum_jsonb_values(airdrop_breakdown);

    RAISE NOTICE 'Migration 031: Fixed airdrop_points for % players', updated_count;
END $$;

-- Add comment
COMMENT ON FUNCTION sum_jsonb_values(JSONB) IS 'Calculates sum of all integer values in a JSONB object';
