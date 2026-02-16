-- =============================================
-- Commercial Module: Ride Table Creation
-- Creates the ride table to properly support the hierarchy:
-- Client → Contract → Prestation → Ride
-- 
-- Each ride represents a step (étape) in a prestation with:
-- - Auto-generated internal reference (RDE-XXXXXX)
-- - Editable client reference
-- - Address link
-- - Time information
-- - Loaded/empty status
-- - Comments
-- =============================================

-- ============================================
-- RIDE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ride (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Auto-generated internal reference
    reference VARCHAR(50) UNIQUE NOT NULL,
    -- Editable client reference (if empty, internal reference is used)
    reference_client VARCHAR(100),
    -- Link to prestation
    prestation_id UUID NOT NULL REFERENCES prestation(id) ON DELETE CASCADE,
    -- Link to address
    address_id UUID REFERENCES address(id) ON DELETE SET NULL,
    -- Position in the prestation itinerary (0-indexed)
    order_index INTEGER NOT NULL DEFAULT 0,
    -- Time information
    heure_depart TIME,
    heure_arrivee TIME,
    -- Truck loaded/empty indicator
    vide BOOLEAN DEFAULT FALSE,
    -- Comment field
    comment TEXT,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ride_reference ON ride(reference);
CREATE INDEX IF NOT EXISTS idx_ride_reference_client ON ride(reference_client);
CREATE INDEX IF NOT EXISTS idx_ride_prestation ON ride(prestation_id);
CREATE INDEX IF NOT EXISTS idx_ride_address ON ride(address_id);
CREATE INDEX IF NOT EXISTS idx_ride_order ON ride(prestation_id, order_index);

-- Auto-generate ride reference function
CREATE OR REPLACE FUNCTION generate_ride_reference()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'RDE-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num FROM ride;
    new_reference := 'RDE-' || LPAD(next_num::TEXT, 6, '0');
    NEW.reference := new_reference;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference
DROP TRIGGER IF EXISTS trigger_generate_ride_reference ON ride;
CREATE TRIGGER trigger_generate_ride_reference
    BEFORE INSERT ON ride FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_ride_reference();

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS trigger_ride_updated_at ON ride;
CREATE TRIGGER trigger_ride_updated_at
    BEFORE UPDATE ON ride FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comment on table
COMMENT ON TABLE ride IS 'Rides/Steps (Trajets/Étapes) within a prestation. Represents individual delivery points in the Client → Contract → Prestation → Ride hierarchy.';
COMMENT ON COLUMN ride.reference IS 'Auto-generated internal reference (RDE-XXXXXX)';
COMMENT ON COLUMN ride.reference_client IS 'Editable client reference. If empty, internal reference is used for display.';
COMMENT ON COLUMN ride.order_index IS 'Position in the prestation itinerary (0 = first/departure, last = arrival)';
COMMENT ON COLUMN ride.vide IS 'Indicates if truck is empty at this step';

-- ============================================
-- Migration: Move data from prestation.etapes to ride table
-- ============================================
-- This migrates existing etapes JSONB data to the new ride table
DO $$
DECLARE
    prest RECORD;
    etape JSONB;
    idx INTEGER;
    addr_id UUID;
BEGIN
    -- Loop through all prestations with etapes
    FOR prest IN 
        SELECT id, etapes FROM prestation 
        WHERE etapes IS NOT NULL AND array_length(etapes, 1) > 0
    LOOP
        idx := 0;
        -- Loop through each etape in the array
        FOREACH etape IN ARRAY prest.etapes
        LOOP
            -- Extract address_id (handle both old UUID format and new JSONB format)
            IF jsonb_typeof(etape) = 'string' THEN
                -- Old format: just a UUID string
                addr_id := (etape #>> '{}')::UUID;
                INSERT INTO ride (prestation_id, address_id, order_index, vide)
                VALUES (prest.id, addr_id, idx, FALSE)
                ON CONFLICT DO NOTHING;
            ELSE
                -- New JSONB format with metadata
                addr_id := (etape->>'address_id')::UUID;
                INSERT INTO ride (
                    prestation_id, 
                    address_id, 
                    order_index, 
                    heure_depart, 
                    heure_arrivee, 
                    vide
                )
                VALUES (
                    prest.id,
                    addr_id,
                    idx,
                    CASE WHEN etape->>'heure_depart' IS NOT NULL AND etape->>'heure_depart' != '' 
                         THEN (etape->>'heure_depart')::TIME ELSE NULL END,
                    CASE WHEN etape->>'heure_arrivee' IS NOT NULL AND etape->>'heure_arrivee' != '' 
                         THEN (etape->>'heure_arrivee')::TIME ELSE NULL END,
                    COALESCE((etape->>'vide')::BOOLEAN, FALSE)
                )
                ON CONFLICT DO NOTHING;
            END IF;
            idx := idx + 1;
        END LOOP;
    END LOOP;
END $$;

-- Note: Keep the etapes column in prestation for now for backward compatibility
-- It can be removed in a future migration once the new ride table is fully integrated
