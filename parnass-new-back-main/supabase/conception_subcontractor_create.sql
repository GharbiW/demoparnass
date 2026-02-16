-- Conception Planning Module: subcontractor table
-- Stores sous-traitant partners for conception planning.

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

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_subcontractor_updated_at ON subcontractor;
CREATE TRIGGER trigger_subcontractor_updated_at
    BEFORE UPDATE ON subcontractor
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE subcontractor IS 'Sous-traitant partners for conception planning';
