-- =============================================
-- Commercial Module: Feedback V0 Migration
-- Adds fields requested in Yann's feedback:
-- - Client references at all levels
-- - Comment fields
-- - Billing flag (à facturer)
-- - Planned mileage for MAD
-- - Price/tariff field
-- - Import tracking (date, user)
-- =============================================

-- ============================================
-- 1. CLIENT: Add reference_client field
-- ============================================
ALTER TABLE client ADD COLUMN IF NOT EXISTS reference_client VARCHAR(100);
COMMENT ON COLUMN client.reference_client IS 'Editable client reference. If empty, internal reference is used for display.';

-- Add comment field to client (if not exists)
ALTER TABLE client ADD COLUMN IF NOT EXISTS comment TEXT;
COMMENT ON COLUMN client.comment IS 'Notes and comments about this client';

-- Add import tracking fields
ALTER TABLE client ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE client ADD COLUMN IF NOT EXISTS imported_by UUID;
ALTER TABLE client ADD COLUMN IF NOT EXISTS imported_by_name VARCHAR(255);
COMMENT ON COLUMN client.imported_at IS 'Date and time when this record was imported';
COMMENT ON COLUMN client.imported_by IS 'User ID who imported this record';
COMMENT ON COLUMN client.imported_by_name IS 'User name who imported this record';

-- ============================================
-- 2. CONTRACT: Add reference_client and comment fields
-- ============================================
ALTER TABLE contract ADD COLUMN IF NOT EXISTS reference_client VARCHAR(100);
COMMENT ON COLUMN contract.reference_client IS 'Editable client reference. If empty, internal reference is used for display.';

ALTER TABLE contract ADD COLUMN IF NOT EXISTS comment TEXT;
COMMENT ON COLUMN contract.comment IS 'Notes and comments about this contract';

-- Add import tracking fields
ALTER TABLE contract ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contract ADD COLUMN IF NOT EXISTS imported_by UUID;
ALTER TABLE contract ADD COLUMN IF NOT EXISTS imported_by_name VARCHAR(255);

-- ============================================
-- 3. PRESTATION: Add reference_client, billing, mileage, price fields
-- ============================================
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS reference_client VARCHAR(100);
COMMENT ON COLUMN prestation.reference_client IS 'Editable client reference. If empty, internal reference is used for display.';

-- Billing flag (À facturer)
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS a_facturer BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN prestation.a_facturer IS 'Flag indicating if this prestation should be billed';

-- Billing date (when marked for billing)
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS date_facturation TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN prestation.date_facturation IS 'Date when this prestation was marked for billing';

-- Planned mileage (for MAD - Mise à disposition)
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS kilometrage_prevu INTEGER;
COMMENT ON COLUMN prestation.kilometrage_prevu IS 'Planned mileage in km (mandatory for MAD type prestations)';

-- Actual mileage (for comparison with planned)
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS kilometrage_reel INTEGER;
COMMENT ON COLUMN prestation.kilometrage_reel IS 'Actual mileage in km (from book P / Solide)';

-- Price/Tariff field
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS tarif DECIMAL(10, 2);
COMMENT ON COLUMN prestation.tarif IS 'Price/tariff for this prestation';

-- Price unit (per km, per trip, etc.)
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS tarif_unite VARCHAR(50);
COMMENT ON COLUMN prestation.tarif_unite IS 'Unit for the tariff (par trajet, par km, forfait, etc.)';

-- Add import tracking fields
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS imported_by UUID;
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS imported_by_name VARCHAR(255);

-- ============================================
-- 4. ADDRESS: Add reference_client field (already has reference and comment)
-- ============================================
ALTER TABLE address ADD COLUMN IF NOT EXISTS reference_client VARCHAR(100);
COMMENT ON COLUMN address.reference_client IS 'Editable client reference. If empty, internal reference is used for display.';

-- Ensure reference column exists (for auto-generation)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'address' AND column_name = 'reference') THEN
        ALTER TABLE address ADD COLUMN reference VARCHAR(50) UNIQUE;
    END IF;
END $$;

-- Add auto-generation trigger for address reference if not exists
CREATE OR REPLACE FUNCTION generate_address_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'ADR-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num FROM address WHERE reference LIKE 'ADR-' || year_part || '-%';
    new_reference := 'ADR-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
    NEW.reference := new_reference;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_address_reference ON address;
CREATE TRIGGER trigger_generate_address_reference
    BEFORE INSERT ON address FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_address_reference();

-- Add GPS radius field
ALTER TABLE address ADD COLUMN IF NOT EXISTS gps_radius INTEGER DEFAULT 50;
COMMENT ON COLUMN address.gps_radius IS 'GPS matching radius in meters (default 50m)';

-- Add import tracking fields
ALTER TABLE address ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE address ADD COLUMN IF NOT EXISTS imported_by UUID;
ALTER TABLE address ADD COLUMN IF NOT EXISTS imported_by_name VARCHAR(255);

-- ============================================
-- 5. CONTACT: Add import tracking fields
-- ============================================
ALTER TABLE contact ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contact ADD COLUMN IF NOT EXISTS imported_by UUID;
ALTER TABLE contact ADD COLUMN IF NOT EXISTS imported_by_name VARCHAR(255);

-- ============================================
-- 6. RIDE: Ensure all fields exist (already created in ride_create.sql)
-- ============================================
-- Add reference_client field to ride if not exists
ALTER TABLE ride ADD COLUMN IF NOT EXISTS reference_client VARCHAR(100);

-- ============================================
-- 7. Create indexes for new fields
-- ============================================
CREATE INDEX IF NOT EXISTS idx_client_reference_client ON client(reference_client);
CREATE INDEX IF NOT EXISTS idx_contract_reference_client ON contract(reference_client);
CREATE INDEX IF NOT EXISTS idx_prestation_reference_client ON prestation(reference_client);
CREATE INDEX IF NOT EXISTS idx_prestation_a_facturer ON prestation(a_facturer);
CREATE INDEX IF NOT EXISTS idx_address_reference_client ON address(reference_client);

-- ============================================
-- 8. Update activity_log to support more entity types
-- ============================================
-- Add metadata column for additional context
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;
COMMENT ON COLUMN activity_log.metadata IS 'Additional metadata about the activity (e.g., import details, field changes)';

-- Add index for filtering by metadata
CREATE INDEX IF NOT EXISTS idx_activity_log_metadata ON activity_log USING GIN (metadata);

-- ============================================
-- Migration complete
-- ============================================
