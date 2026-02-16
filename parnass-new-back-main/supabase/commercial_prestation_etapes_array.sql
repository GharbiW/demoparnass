-- =============================================
-- Migration: Prestation Etapes Array
-- Replace point_depart_id/point_arrivee_id with etapes UUID[] array
-- =============================================

-- Add etapes array column
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS etapes UUID[] DEFAULT '{}';

-- Migrate existing data: combine point_depart_id and point_arrivee_id into etapes array
-- Only migrate when both departure and arrival exist
UPDATE prestation
SET etapes = ARRAY[point_depart_id, point_arrivee_id]
WHERE point_depart_id IS NOT NULL AND point_arrivee_id IS NOT NULL;

-- Handle cases where only departure exists
UPDATE prestation
SET etapes = ARRAY[point_depart_id]
WHERE point_depart_id IS NOT NULL AND point_arrivee_id IS NULL AND etapes = '{}';

-- Handle cases where only arrival exists (unlikely but safe)
UPDATE prestation
SET etapes = ARRAY[point_arrivee_id]
WHERE point_depart_id IS NULL AND point_arrivee_id IS NOT NULL AND etapes = '{}';

-- Drop legacy columns
ALTER TABLE prestation DROP COLUMN IF EXISTS point_depart_id;
ALTER TABLE prestation DROP COLUMN IF EXISTS point_arrivee_id;

-- Drop the junction table (no longer needed)
DROP TABLE IF EXISTS prestation_etape;

-- Add comment for documentation
COMMENT ON COLUMN prestation.etapes IS 'Array of address UUIDs: first = departure, last = arrival, middle = intermediate stops';
