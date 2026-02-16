-- Commercial Module: Complete Schema Initialization
-- Run this file to create all commercial module tables in the correct order
-- 
-- Tables created:
-- 1. client - Client companies
-- 2. address - Delivery/pickup locations
-- 3. client_address - Junction table (many-to-many)
-- 4. contact - Client contact persons
-- 5. contract - Client contracts (also CDC)
-- 6. prestation - Delivery services within contracts
-- 7. activity_log - Activity tracking
-- 8. Storage bucket: commercial-avatars (for client and contact avatars)

-- ============================================
-- STORAGE BUCKET: commercial-avatars
-- ============================================
-- IMPORTANT: Storage buckets cannot be created via SQL
-- You must create the bucket through Supabase Dashboard or Management API
-- See commercial_storage_bucket_create.sql for instructions
--
-- Required bucket settings:
-- - Name: commercial-avatars
-- - Public: true
-- - File size limit: 5242880 (5MB)
-- - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif

-- ============================================
-- Shared Function: update_updated_at_column
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. CLIENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS client (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
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
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'CLI-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num FROM client WHERE reference LIKE 'CLI-' || year_part || '-%';
    new_reference := 'CLI-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
    NEW.reference := new_reference;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_client_reference ON client;
CREATE TRIGGER trigger_generate_client_reference
    BEFORE INSERT ON client FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_client_reference();

DROP TRIGGER IF EXISTS trigger_client_updated_at ON client;
CREATE TRIGGER trigger_client_updated_at
    BEFORE UPDATE ON client FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. ADDRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS address (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_address_name ON address(name);
CREATE INDEX IF NOT EXISTS idx_address_city ON address(city);
CREATE INDEX IF NOT EXISTS idx_address_postal_code ON address(postal_code);

DROP TRIGGER IF EXISTS trigger_address_updated_at ON address;
CREATE TRIGGER trigger_address_updated_at
    BEFORE UPDATE ON address FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. CLIENT_ADDRESS JUNCTION TABLE
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
-- 4. CONTACT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100),
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
-- 5. CONTRACT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contract (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
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
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'CTR-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num FROM contract WHERE reference LIKE 'CTR-' || year_part || '-%';
    new_reference := 'CTR-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
    NEW.reference := new_reference;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_contract_reference ON contract;
CREATE TRIGGER trigger_generate_contract_reference
    BEFORE INSERT ON contract FOR EACH ROW
    WHEN (NEW.reference IS NULL)
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
-- 6. PRESTATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS prestation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    frequence JSONB DEFAULT '[]'::JSONB,
    type_demande VARCHAR(50) DEFAULT 'Régulière' CHECK (type_demande IN ('Régulière', 'Spot', 'MAD')),
    heure_depart TIME,
    heure_arrivee TIME,
    point_depart_id UUID REFERENCES address(id) ON DELETE SET NULL,
    point_arrivee_id UUID REFERENCES address(id) ON DELETE SET NULL,
    typologie_vehicule VARCHAR(50) CHECK (typologie_vehicule IN ('VL', 'SPL', 'CM', 'Caisse Mobile')),
    energie_imposee VARCHAR(50) CHECK (energie_imposee IN ('Gazole', 'Elec', 'Gaz', NULL)),
    type_remorque VARCHAR(50) CHECK (type_remorque IN ('Frigo', 'Hayon', 'Aérienne', 'Plateau', 'Tautliner', NULL)),
    sensible BOOLEAN DEFAULT FALSE,
    code_dechargement VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prestation_reference ON prestation(reference);
CREATE INDEX IF NOT EXISTS idx_prestation_contract ON prestation(contract_id);
CREATE INDEX IF NOT EXISTS idx_prestation_depart ON prestation(point_depart_id);
CREATE INDEX IF NOT EXISTS idx_prestation_arrivee ON prestation(point_arrivee_id);

CREATE OR REPLACE FUNCTION generate_prestation_reference()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'PRE-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num FROM prestation;
    new_reference := 'PRE-' || LPAD(next_num::TEXT, 6, '0');
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
-- 7. ACTIVITY_LOG TABLE
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

-- ============================================
-- Schema initialization complete
-- ============================================
