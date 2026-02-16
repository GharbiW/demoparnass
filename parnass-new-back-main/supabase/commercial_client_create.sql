-- Commercial Module: Client Table
-- Creates the client table for storing company/client information

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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_reference ON client(reference);
CREATE INDEX IF NOT EXISTS idx_client_name ON client(name);
CREATE INDEX IF NOT EXISTS idx_client_status ON client(status);
CREATE INDEX IF NOT EXISTS idx_client_siret ON client(siret);

-- Function to auto-generate reference if not provided
CREATE OR REPLACE FUNCTION generate_client_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    -- Only generate if reference is NULL or empty
    IF NEW.reference IS NULL OR TRIM(NEW.reference) = '' THEN
        year_part := TO_CHAR(NOW(), 'YYYY');
        
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'CLI-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num
        FROM client
        WHERE reference LIKE 'CLI-' || year_part || '-%';
        
        new_reference := 'CLI-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
        NEW.reference := new_reference;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference on insert if not provided
DROP TRIGGER IF EXISTS trigger_generate_client_reference ON client;
CREATE TRIGGER trigger_generate_client_reference
    BEFORE INSERT ON client
    FOR EACH ROW
    WHEN (NEW.reference IS NULL OR TRIM(NEW.reference) = '')
    EXECUTE FUNCTION generate_client_reference();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_client_updated_at ON client;
CREATE TRIGGER trigger_client_updated_at
    BEFORE UPDATE ON client
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE client IS 'Client companies for the commercial module';
COMMENT ON COLUMN client.reference IS 'User-specified unique reference (auto-generated if not provided)';
COMMENT ON COLUMN client.siret IS 'French company identification number';
COMMENT ON COLUMN client.vat_number IS 'VAT/TVA number';
COMMENT ON COLUMN client.avatar_url IS 'URL to client avatar image in Supabase storage';
COMMENT ON COLUMN client.initials IS 'Display initials for avatar fallback';
COMMENT ON COLUMN client.color IS 'Brand color for UI display';
COMMENT ON COLUMN client.status IS 'Active or inactive status';
