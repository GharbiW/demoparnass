-- Commercial Module: Address Table
-- Creates the address table for storing delivery/pickup locations

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

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_address_reference ON address(reference);
CREATE INDEX IF NOT EXISTS idx_address_name ON address(name);
CREATE INDEX IF NOT EXISTS idx_address_city ON address(city);
CREATE INDEX IF NOT EXISTS idx_address_postal_code ON address(postal_code);
CREATE INDEX IF NOT EXISTS idx_address_country ON address(country);

-- Spatial index for coordinates (if PostGIS is available)
-- CREATE INDEX IF NOT EXISTS idx_address_location ON address USING GIST (ST_MakePoint(longitude, latitude));

-- Function to auto-generate address reference if not provided
CREATE OR REPLACE FUNCTION generate_address_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    -- Only generate if reference is NULL or empty
    IF NEW.reference IS NULL OR TRIM(NEW.reference) = '' THEN
        year_part := TO_CHAR(NOW(), 'YYYY');
        
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'ADR-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num
        FROM address
        WHERE reference LIKE 'ADR-' || year_part || '-%';
        
        new_reference := 'ADR-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
        NEW.reference := new_reference;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference on insert if not provided
DROP TRIGGER IF EXISTS trigger_generate_address_reference ON address;
CREATE TRIGGER trigger_generate_address_reference
    BEFORE INSERT ON address
    FOR EACH ROW
    WHEN (NEW.reference IS NULL OR TRIM(NEW.reference) = '')
    EXECUTE FUNCTION generate_address_reference();

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_address_updated_at ON address;
CREATE TRIGGER trigger_address_updated_at
    BEFORE UPDATE ON address
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE address IS 'Delivery and pickup locations for prestations';
COMMENT ON COLUMN address.reference IS 'User-specified unique reference (auto-generated if not provided)';
COMMENT ON COLUMN address.name IS 'Display name for the location (e.g., Entrepôt Principal)';
COMMENT ON COLUMN address.address IS 'Full address as a single line (e.g., Rue Pierre Semard, 94380 Bonneuil-sur-Marne, France)';
COMMENT ON COLUMN address.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN address.longitude IS 'GPS longitude coordinate';
