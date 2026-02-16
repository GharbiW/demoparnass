-- =============================================
-- PARNASS MASTER MIGRATION
-- Safe to re-run: all operations are idempotent
-- Run this in the Supabase SQL Editor
-- =============================================
-- Execution order:
--   Phase 1: Shared functions
--   Phase 2: Commercial base tables (7 tables)
--   Phase 3: Commercial extra tables (ride, document, prestation_template, prestation_version)
--   Phase 4: Commercial migrations (column additions, constraint changes)
--   Phase 5: Backoffice tables (driver_cache, vehicle_cache, sync_status)
--   Phase 6: Backoffice migrations
--   Phase 7: Conception planning tables (5 tables)
-- =============================================


-- ################################################################
-- PHASE 1: SHARED FUNCTIONS
-- ################################################################

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ################################################################
-- PHASE 2: COMMERCIAL BASE TABLES
-- ################################################################

-- ============================================
-- 2.1  CLIENT
-- ============================================
CREATE TABLE IF NOT EXISTS client (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    siret VARCHAR(50),
    vat_number VARCHAR(50),
    avatar_url TEXT,
    initials VARCHAR(10),
    color VARCHAR(10) DEFAULT '#000000',
    headquarters_address TEXT,
    headquarters_postal_code VARCHAR(20),
    headquarters_city VARCHAR(100),
    headquarters_country VARCHAR(100) DEFAULT 'France',
    headquarters_country_code VARCHAR(10) DEFAULT 'FR',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_reference ON client(reference);
CREATE INDEX IF NOT EXISTS idx_client_name ON client(name);
CREATE INDEX IF NOT EXISTS idx_client_status ON client(status);
CREATE INDEX IF NOT EXISTS idx_client_siret ON client(siret);

CREATE OR REPLACE FUNCTION generate_client_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    IF NEW.reference IS NULL OR TRIM(NEW.reference) = '' THEN
        year_part := TO_CHAR(NOW(), 'YYYY');
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'CLI-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num FROM client WHERE reference LIKE 'CLI-' || year_part || '-%';
        new_reference := 'CLI-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
        NEW.reference := new_reference;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_client_reference ON client;
CREATE TRIGGER trigger_generate_client_reference
    BEFORE INSERT ON client FOR EACH ROW
    WHEN (NEW.reference IS NULL OR TRIM(NEW.reference) = '')
    EXECUTE FUNCTION generate_client_reference();

DROP TRIGGER IF EXISTS trigger_client_updated_at ON client;
CREATE TRIGGER trigger_client_updated_at
    BEFORE UPDATE ON client FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2.2  ADDRESS
-- ============================================
CREATE TABLE IF NOT EXISTS address (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    postal_code VARCHAR(20),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'France',
    country_code VARCHAR(10) DEFAULT 'FR',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_address_reference ON address(reference);
CREATE INDEX IF NOT EXISTS idx_address_name ON address(name);
CREATE INDEX IF NOT EXISTS idx_address_city ON address(city);
CREATE INDEX IF NOT EXISTS idx_address_postal_code ON address(postal_code);

CREATE OR REPLACE FUNCTION generate_address_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    IF NEW.reference IS NULL OR TRIM(NEW.reference) = '' THEN
        year_part := TO_CHAR(NOW(), 'YYYY');
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'ADR-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num FROM address WHERE reference LIKE 'ADR-' || year_part || '-%';
        new_reference := 'ADR-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
        NEW.reference := new_reference;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_address_reference ON address;
CREATE TRIGGER trigger_generate_address_reference
    BEFORE INSERT ON address FOR EACH ROW
    WHEN (NEW.reference IS NULL OR TRIM(NEW.reference) = '')
    EXECUTE FUNCTION generate_address_reference();

DROP TRIGGER IF EXISTS trigger_address_updated_at ON address;
CREATE TRIGGER trigger_address_updated_at
    BEFORE UPDATE ON address FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2.3  CLIENT_ADDRESS (junction)
-- ============================================
CREATE TABLE IF NOT EXISTS client_address (
    client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    address_id UUID NOT NULL REFERENCES address(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (client_id, address_id)
);

CREATE INDEX IF NOT EXISTS idx_client_address_client ON client_address(client_id);
CREATE INDEX IF NOT EXISTS idx_client_address_address ON client_address(address_id);

-- ============================================
-- 2.4  CONTACT
-- ============================================
CREATE TABLE IF NOT EXISTS contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100),
    avatar_url TEXT,
    client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_client ON contact(client_id);
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact(email);
CREATE INDEX IF NOT EXISTS idx_contact_name ON contact(last_name, first_name);

DROP TRIGGER IF EXISTS trigger_contact_updated_at ON contact;
CREATE TRIGGER trigger_contact_updated_at
    BEFORE UPDATE ON contact FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2.5  CONTRACT
-- ============================================
CREATE TABLE IF NOT EXISTS contract (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE,
    name VARCHAR(255),
    invoice_code VARCHAR(50),
    type VARCHAR(50) DEFAULT 'Annuel' CHECK (type IN ('Annuel', 'Pluriannuel', 'Spot')),
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_reference ON contract(reference);
CREATE INDEX IF NOT EXISTS idx_contract_client ON contract(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_status ON contract(status);
CREATE INDEX IF NOT EXISTS idx_contract_dates ON contract(start_date, end_date);

CREATE OR REPLACE FUNCTION generate_contract_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    IF NEW.reference IS NULL OR TRIM(NEW.reference) = '' THEN
        year_part := TO_CHAR(NOW(), 'YYYY');
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'CTR-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num FROM contract WHERE reference LIKE 'CTR-' || year_part || '-%';
        new_reference := 'CTR-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
        NEW.reference := new_reference;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_contract_reference ON contract;
CREATE TRIGGER trigger_generate_contract_reference
    BEFORE INSERT ON contract FOR EACH ROW
    WHEN (NEW.reference IS NULL OR TRIM(NEW.reference) = '')
    EXECUTE FUNCTION generate_contract_reference();

CREATE OR REPLACE FUNCTION generate_contract_invoice_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_code IS NULL THEN
        NEW.invoice_code := 'INV-' || NEW.reference;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_contract_invoice_code ON contract;
CREATE TRIGGER trigger_generate_contract_invoice_code
    BEFORE INSERT ON contract FOR EACH ROW
    EXECUTE FUNCTION generate_contract_invoice_code();

DROP TRIGGER IF EXISTS trigger_contract_updated_at ON contract;
CREATE TRIGGER trigger_contract_updated_at
    BEFORE UPDATE ON contract FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2.6  PRESTATION
-- ============================================
CREATE TABLE IF NOT EXISTS prestation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    frequence JSONB DEFAULT '[]'::JSONB,
    type_demande VARCHAR(50) DEFAULT 'Régulière',
    heure_depart TIME,
    heure_arrivee TIME,
    point_depart_id UUID REFERENCES address(id) ON DELETE SET NULL,
    point_arrivee_id UUID REFERENCES address(id) ON DELETE SET NULL,
    typologie_vehicule VARCHAR(50),
    energie_imposee VARCHAR(50),
    type_remorque VARCHAR(50),
    sensible BOOLEAN DEFAULT FALSE,
    code_dechargement VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prestation_reference ON prestation(reference);
CREATE INDEX IF NOT EXISTS idx_prestation_contract ON prestation(contract_id);

CREATE OR REPLACE FUNCTION generate_prestation_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(2);
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    year_part := TO_CHAR(NOW(), 'YY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'PREST-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num FROM prestation WHERE reference LIKE 'PREST-' || year_part || '-%';
    IF next_num = 1 THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'PRE-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num FROM prestation WHERE reference LIKE 'PRE-%';
    END IF;
    new_reference := 'PREST-' || year_part || '-' || LPAD(next_num::TEXT, 6, '0');
    NEW.reference := new_reference;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_prestation_reference ON prestation;
CREATE TRIGGER trigger_generate_prestation_reference
    BEFORE INSERT ON prestation FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_prestation_reference();

DROP TRIGGER IF EXISTS trigger_prestation_updated_at ON prestation;
CREATE TRIGGER trigger_prestation_updated_at
    BEFORE UPDATE ON prestation FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2.7  ACTIVITY_LOG
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    detail VARCHAR(255),
    reference VARCHAR(100),
    user_id UUID,
    user_name VARCHAR(255),
    user_initials VARCHAR(10),
    entity_type VARCHAR(50),
    entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(type);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);


-- ################################################################
-- PHASE 3: COMMERCIAL EXTRA TABLES
-- ################################################################

-- ============================================
-- 3.1  RIDE
-- ============================================
CREATE TABLE IF NOT EXISTS ride (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    reference_client VARCHAR(100),
    prestation_id UUID NOT NULL REFERENCES prestation(id) ON DELETE CASCADE,
    address_id UUID REFERENCES address(id) ON DELETE SET NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    heure_depart TIME,
    heure_arrivee TIME,
    vide BOOLEAN DEFAULT FALSE,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_reference ON ride(reference);
CREATE INDEX IF NOT EXISTS idx_ride_reference_client ON ride(reference_client);
CREATE INDEX IF NOT EXISTS idx_ride_prestation ON ride(prestation_id);
CREATE INDEX IF NOT EXISTS idx_ride_address ON ride(address_id);
CREATE INDEX IF NOT EXISTS idx_ride_order ON ride(prestation_id, order_index);

CREATE OR REPLACE FUNCTION generate_ride_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(2);
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    year_part := TO_CHAR(NOW(), 'YY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'RDE-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num FROM ride WHERE reference LIKE 'RDE-' || year_part || '-%';
    IF next_num = 1 THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'RDE-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num FROM ride WHERE reference LIKE 'RDE-%' AND reference NOT LIKE 'RDE-__-%';
    END IF;
    new_reference := 'RDE-' || year_part || '-' || LPAD(next_num::TEXT, 6, '0');
    NEW.reference := new_reference;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_ride_reference ON ride;
CREATE TRIGGER trigger_generate_ride_reference
    BEFORE INSERT ON ride FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_ride_reference();

DROP TRIGGER IF EXISTS trigger_ride_updated_at ON ride;
CREATE TRIGGER trigger_ride_updated_at
    BEFORE UPDATE ON ride FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3.2  DOCUMENT
-- ============================================
CREATE TABLE IF NOT EXISTS document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    storage_bucket VARCHAR(100) DEFAULT 'commercial-documents',
    uploaded_by UUID,
    uploaded_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_entity ON document(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_created_at ON document(created_at DESC);

-- Ensure entity_type check constraint allows 'client'
DO $$
BEGIN
    ALTER TABLE document DROP CONSTRAINT IF EXISTS document_entity_type_check;
    ALTER TABLE document ADD CONSTRAINT document_entity_type_check
        CHECK (entity_type IN ('contract', 'prestation', 'client'));
EXCEPTION WHEN others THEN
    NULL;
END $$;

CREATE OR REPLACE FUNCTION update_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_document_updated_at ON document;
CREATE TRIGGER trigger_document_updated_at
    BEFORE UPDATE ON document FOR EACH ROW
    EXECUTE FUNCTION update_document_updated_at();

-- ============================================
-- 3.3  PRESTATION_TEMPLATE
-- ============================================
CREATE TABLE IF NOT EXISTS prestation_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    frequence JSONB DEFAULT '[]'::JSONB,
    type_demande VARCHAR(50) DEFAULT 'Régulière',
    heure_depart TIME,
    heure_arrivee TIME,
    etapes JSONB[] DEFAULT '{}',
    typologie_vehicule VARCHAR(50),
    energie_imposee VARCHAR(50),
    type_remorque VARCHAR(50),
    specificites TEXT[],
    sensible BOOLEAN DEFAULT FALSE,
    code_dechargement VARCHAR(50),
    comment TEXT,
    kilometrage_prevu INTEGER,
    type_tarif VARCHAR(50),
    tarif DECIMAL(10, 2),
    tarif_unite VARCHAR(50),
    include_ride_details BOOLEAN DEFAULT FALSE,
    ride_details JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prestation_template_reference ON prestation_template(reference);
CREATE INDEX IF NOT EXISTS idx_prestation_template_name ON prestation_template(name);
CREATE INDEX IF NOT EXISTS idx_prestation_template_category ON prestation_template(category);
CREATE INDEX IF NOT EXISTS idx_prestation_template_type_demande ON prestation_template(type_demande);

CREATE OR REPLACE FUNCTION generate_prestation_template_reference()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'TPL-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num FROM prestation_template;
    new_reference := 'TPL-' || LPAD(next_num::TEXT, 6, '0');
    NEW.reference := new_reference;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_prestation_template_reference ON prestation_template;
CREATE TRIGGER trigger_generate_prestation_template_reference
    BEFORE INSERT ON prestation_template FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_prestation_template_reference();

DROP TRIGGER IF EXISTS trigger_prestation_template_updated_at ON prestation_template;
CREATE TRIGGER trigger_prestation_template_updated_at
    BEFORE UPDATE ON prestation_template FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3.4  PRESTATION_VERSION (versioning / archiving)
-- ============================================

-- Add versioning columns to prestation first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prestation' AND column_name = 'status') THEN
        ALTER TABLE prestation ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prestation' AND column_name = 'version') THEN
        ALTER TABLE prestation ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prestation' AND column_name = 'archived_at') THEN
        ALTER TABLE prestation ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prestation' AND column_name = 'archived_by') THEN
        ALTER TABLE prestation ADD COLUMN archived_by UUID;
    END IF;
END $$;

UPDATE prestation SET status = 'active' WHERE status IS NULL;
UPDATE prestation SET version = 1 WHERE version IS NULL;
CREATE INDEX IF NOT EXISTS idx_prestation_status ON prestation(status);

CREATE TABLE IF NOT EXISTS prestation_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestation_id UUID NOT NULL REFERENCES prestation(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    date_effet TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'applied'
        CHECK (status IN ('applied', 'scheduled', 'cancelled')),
    snapshot JSONB NOT NULL,
    change_description TEXT,
    created_by UUID,
    created_by_name VARCHAR(255),
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prestation_version_prestation
    ON prestation_version(prestation_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_prestation_version_scheduled
    ON prestation_version(status, date_effet) WHERE status = 'scheduled';


-- ################################################################
-- PHASE 4: COMMERCIAL MIGRATIONS (column additions / changes)
-- ################################################################

-- ============================================
-- 4.1  Client billing address
-- ============================================
ALTER TABLE client ADD COLUMN IF NOT EXISTS has_different_billing_address BOOLEAN DEFAULT FALSE;
ALTER TABLE client ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(20);
ALTER TABLE client ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100);
ALTER TABLE client ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100) DEFAULT 'France';
ALTER TABLE client ADD COLUMN IF NOT EXISTS billing_country_code VARCHAR(10) DEFAULT 'FR';

-- ============================================
-- 4.2  Contact: avatar_url + notifiable
-- ============================================
ALTER TABLE contact ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE contact ADD COLUMN IF NOT EXISTS is_notifiable_exploitation BOOLEAN DEFAULT FALSE;

-- ============================================
-- 4.3  Prestation: equipment, pricing, etapes
-- ============================================
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS specificites TEXT[];
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS type_tarif VARCHAR(50);

-- Drop code_dechargement (superseded by specificites)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'prestation' AND column_name = 'code_dechargement') THEN
        ALTER TABLE prestation DROP COLUMN code_dechargement;
    END IF;
END$$;

-- ============================================
-- 4.4  Prestation etapes migration (UUID[] -> JSONB[])
--       ONLY runs if the old columns still exist
-- ============================================

-- Step A: Migrate from point_depart_id/point_arrivee_id to etapes UUID[]
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'prestation' AND column_name = 'point_depart_id') THEN
        -- Add etapes UUID[] if not exists
        ALTER TABLE prestation ADD COLUMN IF NOT EXISTS etapes UUID[] DEFAULT '{}';
        -- Migrate data
        UPDATE prestation SET etapes = ARRAY[point_depart_id, point_arrivee_id]
        WHERE point_depart_id IS NOT NULL AND point_arrivee_id IS NOT NULL AND (etapes IS NULL OR etapes = '{}');
        UPDATE prestation SET etapes = ARRAY[point_depart_id]
        WHERE point_depart_id IS NOT NULL AND point_arrivee_id IS NULL AND (etapes IS NULL OR etapes = '{}');
        -- Drop old columns
        ALTER TABLE prestation DROP COLUMN IF EXISTS point_depart_id;
        ALTER TABLE prestation DROP COLUMN IF EXISTS point_arrivee_id;
        DROP TABLE IF EXISTS prestation_etape;
        RAISE NOTICE 'Migrated prestation from point_depart_id/point_arrivee_id to etapes UUID[]';
    END IF;
END $$;

-- Step B: Convert etapes from UUID[] to JSONB[]
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'prestation' AND column_name = 'etapes' AND udt_name = '_uuid'
    ) THEN
        ALTER TABLE prestation ADD COLUMN IF NOT EXISTS etapes_new JSONB[] DEFAULT '{}';
        UPDATE prestation SET etapes_new = (
            SELECT COALESCE(
                array_agg(
                    jsonb_build_object('address_id', elem::text, 'heure_depart', NULL, 'heure_arrivee', NULL, 'vide', false)
                    ORDER BY ordinality
                ), '{}'::jsonb[]
            )
            FROM unnest(etapes) WITH ORDINALITY AS t(elem, ordinality)
        )
        WHERE etapes IS NOT NULL AND array_length(etapes, 1) > 0;
        ALTER TABLE prestation DROP COLUMN IF EXISTS etapes;
        ALTER TABLE prestation RENAME COLUMN etapes_new TO etapes;
        RAISE NOTICE 'Converted prestation etapes from UUID[] to JSONB[]';
    END IF;
END $$;

-- Ensure etapes column exists as JSONB[] (for fresh installs where table was created without it)
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS etapes JSONB[] DEFAULT '{}';

-- Fix corrupted etapes data (double-nested JSON)
UPDATE prestation
SET etapes = (
    SELECT array_agg(
        CASE
            WHEN (elem->>'address_id') LIKE '{%' THEN
                jsonb_build_object(
                    'address_id', ((elem->>'address_id')::jsonb)->>'address_id',
                    'heure_depart', COALESCE(((elem->>'address_id')::jsonb)->>'heure_depart', elem->>'heure_depart'),
                    'heure_arrivee', COALESCE(((elem->>'address_id')::jsonb)->>'heure_arrivee', elem->>'heure_arrivee'),
                    'vide', COALESCE((((elem->>'address_id')::jsonb)->>'vide')::boolean, (elem->>'vide')::boolean, false)
                )
            ELSE elem
        END
        ORDER BY ordinality
    )
    FROM unnest(etapes) WITH ORDINALITY AS t(elem, ordinality)
)
WHERE etapes IS NOT NULL
  AND array_length(etapes, 1) > 0
  AND EXISTS (SELECT 1 FROM unnest(etapes) AS e WHERE (e->>'address_id') LIKE '{%');

-- ============================================
-- 4.5  Feedback V0: reference_client, billing, tariffs, import tracking
-- ============================================

-- Client
ALTER TABLE client ADD COLUMN IF NOT EXISTS reference_client VARCHAR(100);
ALTER TABLE client ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE client ADD COLUMN IF NOT EXISTS imported_by UUID;
ALTER TABLE client ADD COLUMN IF NOT EXISTS imported_by_name VARCHAR(255);

-- Contract
ALTER TABLE contract ADD COLUMN IF NOT EXISTS reference_client VARCHAR(100);
ALTER TABLE contract ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE contract ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contract ADD COLUMN IF NOT EXISTS imported_by UUID;
ALTER TABLE contract ADD COLUMN IF NOT EXISTS imported_by_name VARCHAR(255);

-- Prestation
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS reference_client VARCHAR(100);
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS a_facturer BOOLEAN DEFAULT FALSE;
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS date_facturation TIMESTAMP WITH TIME ZONE;
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS kilometrage_prevu INTEGER;
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS kilometrage_reel INTEGER;
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS tarif DECIMAL(10, 2);
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS tarif_unite VARCHAR(50);
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS imported_by UUID;
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS imported_by_name VARCHAR(255);

-- Address
ALTER TABLE address ADD COLUMN IF NOT EXISTS reference_client VARCHAR(100);
ALTER TABLE address ADD COLUMN IF NOT EXISTS gps_radius INTEGER DEFAULT 50;
ALTER TABLE address ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE address ADD COLUMN IF NOT EXISTS imported_by UUID;
ALTER TABLE address ADD COLUMN IF NOT EXISTS imported_by_name VARCHAR(255);

-- Contact import tracking
ALTER TABLE contact ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contact ADD COLUMN IF NOT EXISTS imported_by UUID;
ALTER TABLE contact ADD COLUMN IF NOT EXISTS imported_by_name VARCHAR(255);

-- Activity log metadata
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;
CREATE INDEX IF NOT EXISTS idx_activity_log_metadata ON activity_log USING GIN (metadata);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_client_reference_client ON client(reference_client);
CREATE INDEX IF NOT EXISTS idx_contract_reference_client ON contract(reference_client);
CREATE INDEX IF NOT EXISTS idx_prestation_reference_client ON prestation(reference_client);
CREATE INDEX IF NOT EXISTS idx_prestation_a_facturer ON prestation(a_facturer);
CREATE INDEX IF NOT EXISTS idx_address_reference_client ON address(reference_client);

-- ============================================
-- 4.6  Tarif contractuel (km/heures)
-- ============================================
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS tarif_km_contractuel DECIMAL(10, 2);
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS tarif_heures_contractuel DECIMAL(10, 2);
ALTER TABLE prestation_template ADD COLUMN IF NOT EXISTS tarif_km_contractuel DECIMAL(10, 2);
ALTER TABLE prestation_template ADD COLUMN IF NOT EXISTS tarif_heures_contractuel DECIMAL(10, 2);

-- ============================================
-- 4.7  Template: client_id, contract_id, code_article
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'prestation_template' AND column_name = 'client_id') THEN
        ALTER TABLE prestation_template ADD COLUMN client_id UUID REFERENCES client(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'prestation_template' AND column_name = 'contract_id') THEN
        ALTER TABLE prestation_template ADD COLUMN contract_id UUID REFERENCES contract(id) ON DELETE SET NULL;
    END IF;
END $$;
ALTER TABLE prestation_template ADD COLUMN IF NOT EXISTS code_article VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_prestation_template_client ON prestation_template(client_id);
CREATE INDEX IF NOT EXISTS idx_prestation_template_contract ON prestation_template(contract_id);
CREATE INDEX IF NOT EXISTS idx_prestation_template_code_article ON prestation_template(code_article);

-- ============================================
-- 4.8  Ride: 4 timestamps + addresses
-- ============================================
ALTER TABLE ride ADD COLUMN IF NOT EXISTS presence_chargement TIMESTAMP WITH TIME ZONE;
ALTER TABLE ride ADD COLUMN IF NOT EXISTS depart_chargement TIMESTAMP WITH TIME ZONE;
ALTER TABLE ride ADD COLUMN IF NOT EXISTS arrivee_livraison TIMESTAMP WITH TIME ZONE;
ALTER TABLE ride ADD COLUMN IF NOT EXISTS fin_livraison TIMESTAMP WITH TIME ZONE;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ride' AND column_name = 'address_depart') THEN
        ALTER TABLE ride ADD COLUMN address_depart UUID REFERENCES address(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ride' AND column_name = 'address_arrivee') THEN
        ALTER TABLE ride ADD COLUMN address_arrivee UUID REFERENCES address(id);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_ride_presence_chargement ON ride(presence_chargement);
CREATE INDEX IF NOT EXISTS idx_ride_arrivee_livraison ON ride(arrivee_livraison);
CREATE INDEX IF NOT EXISTS idx_ride_address_depart ON ride(address_depart);
CREATE INDEX IF NOT EXISTS idx_ride_address_arrivee ON ride(address_arrivee);

-- ============================================
-- 4.9  Type demande: rename 'Spot' -> 'SUP'
-- ============================================
DO $$
DECLARE r RECORD;
BEGIN
    -- Drop old check constraints on prestation.type_demande
    FOR r IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'prestation' AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%type_demande%'
    LOOP
        EXECUTE 'ALTER TABLE prestation DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
    -- Drop old check constraints on prestation_template.type_demande
    FOR r IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'prestation_template' AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%type_demande%'
    LOOP
        EXECUTE 'ALTER TABLE prestation_template DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

UPDATE prestation SET type_demande = 'SUP' WHERE type_demande = 'Spot';
UPDATE prestation_template SET type_demande = 'SUP' WHERE type_demande = 'Spot';

DO $$
BEGIN
    ALTER TABLE prestation ADD CONSTRAINT prestation_type_demande_check
        CHECK (type_demande IN ('Régulière', 'SUP', 'MAD'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE prestation_template ADD CONSTRAINT prestation_template_type_demande_check
        CHECK (type_demande IN ('Régulière', 'SUP', 'MAD'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 4.10  Type tarif: rename 'tk' -> 'terme_kilometrique'
-- ============================================
UPDATE prestation SET type_tarif = 'terme_kilometrique' WHERE type_tarif = 'tk';
UPDATE prestation_template SET type_tarif = 'terme_kilometrique' WHERE type_tarif = 'tk';

DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'prestation_template' AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%type_tarif%'
    LOOP
        EXECUTE 'ALTER TABLE prestation_template DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
    FOR r IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'prestation' AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%type_tarif%'
    LOOP
        EXECUTE 'ALTER TABLE prestation DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

DO $$
BEGIN
    ALTER TABLE prestation_template ADD CONSTRAINT prestation_template_type_tarif_check
        CHECK (type_tarif IN ('forfaitaire', 'terme_kilometrique', 'taux_horaire'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE prestation ADD CONSTRAINT prestation_type_tarif_check
        CHECK (type_tarif IN ('forfaitaire', 'terme_kilometrique', 'taux_horaire'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 4.11  Contract: ensure reference NOT NULL
-- ============================================
DO $$
DECLARE
    rec RECORD;
    year_part VARCHAR(4);
    next_num INTEGER;
    new_ref VARCHAR(50);
BEGIN
    FOR rec IN SELECT id FROM contract WHERE reference IS NULL OR TRIM(reference) = '' LOOP
        year_part := TO_CHAR(NOW(), 'YYYY');
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'CTR-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num FROM contract WHERE reference LIKE 'CTR-' || year_part || '-%';
        new_ref := 'CTR-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
        UPDATE contract SET reference = new_ref WHERE id = rec.id;
    END LOOP;
END $$;
ALTER TABLE contract ALTER COLUMN reference SET NOT NULL;


-- ################################################################
-- PHASE 5: BACKOFFICE TABLES
-- ################################################################

-- ============================================
-- 5.1  DRIVER_CACHE
-- ============================================
CREATE TABLE IF NOT EXISTS driver_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factorial_id INTEGER UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT,
    birthday DATE,
    team_id INTEGER,
    team_name TEXT,
    shift TEXT,
    available_weekends TEXT,
    matricule TEXT,
    permits TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    visite_medicale DATE,
    agence TEXT,
    zone TEXT,
    amplitude INTEGER,
    decoucher BOOLEAN,
    status TEXT DEFAULT 'disponible' CHECK (status IN ('disponible', 'occupe', 'indisponible')),
    indisponibilite_raison TEXT,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_cache_factorial_id ON driver_cache(factorial_id);
CREATE INDEX IF NOT EXISTS idx_driver_cache_status ON driver_cache(status);
CREATE INDEX IF NOT EXISTS idx_driver_cache_team_name ON driver_cache(team_name);
CREATE INDEX IF NOT EXISTS idx_driver_cache_agence ON driver_cache(agence);
CREATE INDEX IF NOT EXISTS idx_driver_cache_name ON driver_cache(last_name, first_name);

CREATE OR REPLACE FUNCTION update_driver_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_driver_cache_updated_at ON driver_cache;
CREATE TRIGGER trigger_update_driver_cache_updated_at
    BEFORE UPDATE ON driver_cache FOR EACH ROW
    EXECUTE FUNCTION update_driver_cache_updated_at();

-- ============================================
-- 5.2  VEHICLE_CACHE
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    myrentcar_id INTEGER UNIQUE,
    numero TEXT,
    immatriculation TEXT NOT NULL,
    type TEXT,
    type_code TEXT,
    marque_modele TEXT,
    energie TEXT,
    energie_id INTEGER,
    kilometrage INTEGER,
    date_dernier_km DATE,
    date_mise_circulation DATE,
    capacite_reservoir INTEGER,
    poids_vide TEXT,
    poids_charge TEXT,
    prime_volume DECIMAL(10,2),
    agence_proprietaire TEXT,
    category_code TEXT,
    numero_serie TEXT,
    status TEXT DEFAULT 'disponible' CHECK (status IN ('disponible', 'en_tournee', 'maintenance', 'indisponible')),
    semi_compatibles TEXT[] DEFAULT '{}',
    equipements TEXT[] DEFAULT '{}',
    localisation TEXT,
    last_position_update TIMESTAMPTZ,
    prochain_ct DATE,
    prochain_entretien DATE,
    titulaire_id UUID REFERENCES driver_cache(id) ON DELETE SET NULL,
    maintenance_type TEXT,
    maintenance_date_entree DATE,
    maintenance_etr DATE,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_cache_myrentcar_id ON vehicle_cache(myrentcar_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_immatriculation ON vehicle_cache(immatriculation);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_status ON vehicle_cache(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_type ON vehicle_cache(type);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_energie ON vehicle_cache(energie);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_titulaire_id ON vehicle_cache(titulaire_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_category_code ON vehicle_cache(category_code);

CREATE OR REPLACE FUNCTION update_vehicle_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vehicle_cache_updated_at ON vehicle_cache;
CREATE TRIGGER trigger_update_vehicle_cache_updated_at
    BEFORE UPDATE ON vehicle_cache FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_cache_updated_at();

-- ============================================
-- 5.3  SYNC_STATUS
-- ============================================
CREATE TABLE IF NOT EXISTS sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('drivers', 'vehicles', 'all')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    records_synced INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_message TEXT,
    triggered_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_status_entity_type ON sync_status(entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_status_status ON sync_status(status);
CREATE INDEX IF NOT EXISTS idx_sync_status_started_at ON sync_status(started_at DESC);


-- ################################################################
-- PHASE 6: BACKOFFICE MIGRATIONS
-- ################################################################

-- ============================================
-- 6.1  Driver cache: Factorial custom fields
-- ============================================
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS numero_carte_as24 TEXT;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS date_remise_carte_as24 DATE;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS date_restitution_as24 DATE;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS permis_de_conduire DATE;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS fco DATE;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS adr DATE;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS habilitation TEXT;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS formation_11239_11262 DATE;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS lieu_prise_poste TEXT;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS forfait_weekend TEXT;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS login_email TEXT;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS state TEXT;

-- ============================================
-- 6.2  Vehicle cache: Wincpl fields (comprehensive)
-- ============================================
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'myrentcar';
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS wincpl_code TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS id_societe INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS id_agence INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS categorie_vehicule TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_vehicule_code INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS marque_vehicule TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS en_activite BOOLEAN DEFAULT true;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS interne TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS numero_chassis TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS numero_moteur TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS numero_chassis_aux TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS puissance_vehicule NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS puissance_kw NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS cylindree NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_cylindres INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_soupapes INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_vitesses INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS code_moteur TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_transmission TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_injection TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS turbo_compresseur BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS propulsion TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS vitesse_moteur NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS longueur_totale NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS largeur_totale NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS hauteur_totale NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS volume_vehicule NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS volume_maxi NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS charge_utile NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS poids_total_roulant NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS poids_maxi_marchandises NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS ptac NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS ptr NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_essieux INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS poids_moyen_essieu NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_carrosserie TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_carrosserie_2 TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS genre_carrosserie TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS carrosserie_cg TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS genre_cg TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_carte_grise TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_places_assises INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_places_debout INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_couchettes INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_portes INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS metre_plancher NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS pal_vehicule INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS energie_vehicule TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS contenance_reservoir NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS contenance_reservoir_aux NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS conso_utac NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS conso_urbaine NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS conso_extra_urbaine NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS conso_mixte NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS co2 NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS co2_urbain NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS co2_extra_urbain NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS emission_co2 NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS profil_co2 TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS norme_pollution TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS critair INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS filtre_a_particules BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS adblue_flag BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS decibels_vehicule NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS regime_decibels NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS contenance_huile NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS contenance_huile_aux NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS contenance_huile_boite NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_achat TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS km_achat NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_sortie TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS km_sortie NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_carte_grise TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_cg TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_fin_garantie_vehicule TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS km_fin_garantie_vehicule NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_fin_garantie_moteur TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS km_fin_garantie_moteur NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_entree_groupe TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS km_entree_groupe NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS km_compteur NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS immatriculation_precedente TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS code_assureur TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS assurance_num_contrat TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS assurance_date_echeance TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS assurance_montant NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS assurance_franchise NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS assurance_devise TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_transport TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS sous_genre_vehicule TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_cuves INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS code_type_semi TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS porteur TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS contraintes TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS en_vente BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS vendu BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS visible_transport BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS visible_garage BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS commentaire TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS tel_vehicule TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS licence TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS wincpl_raw_data JSONB;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS absences JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_vehicle_cache_wincpl_code ON vehicle_cache(wincpl_code) WHERE wincpl_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_data_source ON vehicle_cache(data_source);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_en_activite ON vehicle_cache(en_activite);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_categorie ON vehicle_cache(categorie_vehicule) WHERE categorie_vehicule IS NOT NULL;

-- Make myrentcar_id nullable (Wincpl vehicles won't have one)
ALTER TABLE vehicle_cache ALTER COLUMN myrentcar_id DROP NOT NULL;


-- ################################################################
-- PHASE 7: CONCEPTION PLANNING TABLES
-- ################################################################

-- ============================================
-- 7.1  PLANNING_VERSION
-- ============================================
CREATE TABLE IF NOT EXISTS planning_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start DATE NOT NULL,
    version_number INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'publie', 'archive')),
    published_at TIMESTAMP WITH TIME ZONE,
    published_by TEXT,
    notes TEXT,
    stats JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planning_version_week ON planning_version(week_start);
CREATE INDEX IF NOT EXISTS idx_planning_version_status ON planning_version(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_planning_version_week_num ON planning_version(week_start, version_number);

DROP TRIGGER IF EXISTS trigger_planning_version_updated_at ON planning_version;
CREATE TRIGGER trigger_planning_version_updated_at
    BEFORE UPDATE ON planning_version FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7.2  PLANNING_TOURNEE
-- ============================================
CREATE TABLE IF NOT EXISTS planning_tournee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    site VARCHAR(100),
    week_start DATE NOT NULL,
    driver_id UUID,
    vehicle_id UUID,
    vehicle_type VARCHAR(50),
    energy VARCHAR(50),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    version_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planning_tournee_week ON planning_tournee(week_start);
CREATE INDEX IF NOT EXISTS idx_planning_tournee_driver ON planning_tournee(driver_id);
CREATE INDEX IF NOT EXISTS idx_planning_tournee_vehicle ON planning_tournee(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_planning_tournee_status ON planning_tournee(status);

CREATE OR REPLACE FUNCTION generate_tournee_reference()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'TRN-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num FROM planning_tournee;
    NEW.reference := 'TRN-' || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_tournee_reference ON planning_tournee;
CREATE TRIGGER trigger_generate_tournee_reference
    BEFORE INSERT ON planning_tournee FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_tournee_reference();

DROP TRIGGER IF EXISTS trigger_planning_tournee_updated_at ON planning_tournee;
CREATE TRIGGER trigger_planning_tournee_updated_at
    BEFORE UPDATE ON planning_tournee FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7.3  PLANNING_COURSE
-- ============================================
CREATE TABLE IF NOT EXISTS planning_course (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestation_id UUID REFERENCES prestation(id) ON DELETE CASCADE,
    tournee_id UUID REFERENCES planning_tournee(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    start_location TEXT,
    end_location TEXT,
    client_name VARCHAR(200),
    prestation_reference VARCHAR(100),
    driver_id UUID,
    driver_name VARCHAR(200),
    vehicle_id UUID,
    vehicle_immat VARCHAR(50),
    assignment_status VARCHAR(30) DEFAULT 'non_affectee'
        CHECK (assignment_status IN ('affectee', 'partiellement_affectee', 'non_affectee')),
    is_sensitive BOOLEAN DEFAULT FALSE,
    is_sup BOOLEAN DEFAULT FALSE,
    vehicle_type VARCHAR(50),
    vehicle_energy VARCHAR(50),
    driver_type VARCHAR(50),
    required_skills JSONB DEFAULT '[]'::JSONB,
    non_placement_reason VARCHAR(50),
    missing_resource VARCHAR(20),
    comments TEXT,
    site VARCHAR(100),
    actual_start_time TIME,
    actual_end_time TIME,
    actual_driver_id UUID,
    actual_vehicle_id UUID,
    actual_start_location TEXT,
    actual_end_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planning_course_date ON planning_course(date);
CREATE INDEX IF NOT EXISTS idx_planning_course_prestation ON planning_course(prestation_id);
CREATE INDEX IF NOT EXISTS idx_planning_course_tournee ON planning_course(tournee_id);
CREATE INDEX IF NOT EXISTS idx_planning_course_driver ON planning_course(driver_id);
CREATE INDEX IF NOT EXISTS idx_planning_course_vehicle ON planning_course(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_planning_course_status ON planning_course(assignment_status);
CREATE INDEX IF NOT EXISTS idx_planning_course_date_status ON planning_course(date, assignment_status);

DROP TRIGGER IF EXISTS trigger_planning_course_updated_at ON planning_course;
CREATE TRIGGER trigger_planning_course_updated_at
    BEFORE UPDATE ON planning_course FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7.4  ALERT_RULE
-- ============================================
CREATE TABLE IF NOT EXISTS alert_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('amplitude', 'ressources', 'qualite', 'planning', 'custom')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critique', 'warning', 'info')),
    condition_text TEXT,
    threshold NUMERIC DEFAULT 0,
    tolerance NUMERIC DEFAULT 0,
    target_date DATE,
    description TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    is_builtin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rule_category ON alert_rule(category);
CREATE INDEX IF NOT EXISTS idx_alert_rule_enabled ON alert_rule(enabled);

DROP TRIGGER IF EXISTS trigger_alert_rule_updated_at ON alert_rule;
CREATE TRIGGER trigger_alert_rule_updated_at
    BEFORE UPDATE ON alert_rule FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7.5  SUBCONTRACTOR
-- ============================================
CREATE TABLE IF NOT EXISTS subcontractor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    siret VARCHAR(50),
    contact_name VARCHAR(200),
    phone VARCHAR(30),
    email VARCHAR(200),
    address TEXT,
    city VARCHAR(100),
    specialties JSONB DEFAULT '[]'::JSONB,
    vehicle_types JSONB DEFAULT '[]'::JSONB,
    rating NUMERIC(3,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    status VARCHAR(20) DEFAULT 'actif' CHECK (status IN ('actif', 'inactif')),
    contract_count INTEGER DEFAULT 0,
    active_vehicles INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcontractor_status ON subcontractor(status);
CREATE INDEX IF NOT EXISTS idx_subcontractor_name ON subcontractor(name);

DROP TRIGGER IF EXISTS trigger_subcontractor_updated_at ON subcontractor;
CREATE TRIGGER trigger_subcontractor_updated_at
    BEFORE UPDATE ON subcontractor FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ################################################################
-- PHASE 8: ROW LEVEL SECURITY (RLS)
-- ################################################################

-- Enable RLS on tables that need it
ALTER TABLE document ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestation_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies: document
DO $$ BEGIN
    CREATE POLICY "Allow all for authenticated users" ON document FOR ALL
        USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies: prestation_template
DO $$ BEGIN
    CREATE POLICY "prestation_template_select_policy" ON prestation_template FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "prestation_template_insert_policy" ON prestation_template FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "prestation_template_update_policy" ON prestation_template FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "prestation_template_delete_policy" ON prestation_template FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies: driver_cache
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to read driver_cache" ON driver_cache FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to insert driver_cache" ON driver_cache FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to update driver_cache" ON driver_cache FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to delete driver_cache" ON driver_cache FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies: vehicle_cache
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to read vehicle_cache" ON vehicle_cache FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to insert vehicle_cache" ON vehicle_cache FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to update vehicle_cache" ON vehicle_cache FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to delete vehicle_cache" ON vehicle_cache FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies: sync_status
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to read sync_status" ON sync_status FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to insert sync_status" ON sync_status FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to update sync_status" ON sync_status FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ################################################################
-- PHASE 9: DATA MIGRATION – Prestation etapes → Ride
-- ################################################################
-- Migrate existing etapes JSONB data from prestation to the ride table
-- (only runs for rows that haven't been migrated yet)

DO $$
DECLARE
    prest RECORD;
    etape JSONB;
    idx INTEGER;
    addr_id UUID;
BEGIN
    FOR prest IN
        SELECT id, etapes FROM prestation
        WHERE etapes IS NOT NULL AND array_length(etapes, 1) > 0
          AND NOT EXISTS (SELECT 1 FROM ride WHERE ride.prestation_id = prestation.id LIMIT 1)
    LOOP
        idx := 0;
        FOREACH etape IN ARRAY prest.etapes
        LOOP
            IF jsonb_typeof(etape) = 'string' THEN
                addr_id := (etape #>> '{}')::UUID;
                INSERT INTO ride (prestation_id, address_id, order_index, vide)
                VALUES (prest.id, addr_id, idx, FALSE)
                ON CONFLICT DO NOTHING;
            ELSE
                addr_id := (etape->>'address_id')::UUID;
                INSERT INTO ride (prestation_id, address_id, order_index, heure_depart, heure_arrivee, vide)
                VALUES (
                    prest.id, addr_id, idx,
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


-- ################################################################
-- DONE
-- ################################################################
-- Tables created/updated:
--   Commercial:  client, address, client_address, contact, contract,
--                prestation, activity_log, ride, document,
--                prestation_template, prestation_version
--   Backoffice:  driver_cache, vehicle_cache, sync_status
--   Conception:  planning_version, planning_tournee, planning_course,
--                alert_rule, subcontractor
--
-- MANUAL STEPS STILL NEEDED:
--   1. Create storage bucket 'commercial-avatars' in Supabase Dashboard > Storage
--      (Public: YES, File size limit: 5MB, MIME: image/jpeg, image/png, image/webp, image/gif)
--   2. Create storage bucket 'commercial-documents' in Supabase Dashboard > Storage
--      (Public: NO, File size limit: 10MB)
-- ################################################################
