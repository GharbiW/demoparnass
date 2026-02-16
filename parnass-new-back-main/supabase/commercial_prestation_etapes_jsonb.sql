-- =============================================
-- Migration: Prestation Etapes JSONB Array
-- Change etapes from UUID[] to JSONB[] to store additional step metadata
-- Each step now contains: address_id, heure_depart, heure_arrivee, vide
-- =============================================

-- Step 1: Add a temporary column to hold the new JSONB array
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS etapes_new JSONB[] DEFAULT '{}';

-- Step 2: Migrate existing data from UUID[] to JSONB[]
-- Convert each UUID to a JSONB object with the new structure
UPDATE prestation
SET etapes_new = (
  SELECT COALESCE(
    array_agg(
      jsonb_build_object(
        'address_id', elem::text,
        'heure_depart', NULL,
        'heure_arrivee', NULL,
        'vide', false
      )
      ORDER BY ordinality
    ),
    '{}'::jsonb[]
  )
  FROM unnest(etapes) WITH ORDINALITY AS t(elem, ordinality)
)
WHERE etapes IS NOT NULL AND array_length(etapes, 1) > 0;

-- Step 3: Drop the old UUID[] column
ALTER TABLE prestation DROP COLUMN IF EXISTS etapes;

-- Step 4: Rename the new column to etapes
ALTER TABLE prestation RENAME COLUMN etapes_new TO etapes;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN prestation.etapes IS 'Array of step objects: { address_id (UUID), heure_depart (TIME, optional), heure_arrivee (TIME, optional), vide (BOOLEAN) }. First = departure, last = arrival, middle = intermediate stops.';
