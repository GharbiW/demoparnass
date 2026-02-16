-- Commercial Module: Prestation Table
-- Creates the prestation (service) table for storing delivery services within contracts

CREATE TABLE IF NOT EXISTS prestation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    
    -- Schedule
    frequence JSONB DEFAULT '[]'::JSONB,
    type_demande VARCHAR(50) DEFAULT 'Régulière' CHECK (type_demande IN ('Régulière', 'Spot', 'MAD')),
    heure_depart TIME,
    heure_arrivee TIME,
    
    -- Locations
    point_depart_id UUID REFERENCES address(id) ON DELETE SET NULL,
    point_arrivee_id UUID REFERENCES address(id) ON DELETE SET NULL,
    
    -- Vehicle requirements
    typologie_vehicule VARCHAR(50) CHECK (typologie_vehicule IN ('VL', 'SPL', 'CM', 'Caisse Mobile')),
    energie_imposee VARCHAR(50) CHECK (energie_imposee IN ('Gazole', 'Elec', 'Gaz', NULL)),
    type_remorque VARCHAR(50) CHECK (type_remorque IN ('Frigo', 'Hayon', 'Aérienne', 'Plateau', 'Tautliner', NULL)),
    
    -- Additional flags
    sensible BOOLEAN DEFAULT FALSE,
    code_dechargement VARCHAR(50),
    comment TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_prestation_reference ON prestation(reference);
CREATE INDEX IF NOT EXISTS idx_prestation_contract ON prestation(contract_id);
CREATE INDEX IF NOT EXISTS idx_prestation_depart ON prestation(point_depart_id);
CREATE INDEX IF NOT EXISTS idx_prestation_arrivee ON prestation(point_arrivee_id);
CREATE INDEX IF NOT EXISTS idx_prestation_type_demande ON prestation(type_demande);

-- Function to auto-generate prestation reference
CREATE OR REPLACE FUNCTION generate_prestation_reference()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'PRE-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num
    FROM prestation;
    
    new_reference := 'PRE-' || LPAD(next_num::TEXT, 6, '0');
    NEW.reference := new_reference;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference on insert
DROP TRIGGER IF EXISTS trigger_generate_prestation_reference ON prestation;
CREATE TRIGGER trigger_generate_prestation_reference
    BEFORE INSERT ON prestation
    FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_prestation_reference();

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_prestation_updated_at ON prestation;
CREATE TRIGGER trigger_prestation_updated_at
    BEFORE UPDATE ON prestation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE prestation IS 'Delivery services within contracts';
COMMENT ON COLUMN prestation.reference IS 'Auto-generated unique reference (PRE-XXXXXX)';
COMMENT ON COLUMN prestation.frequence IS 'JSON array of days (e.g., ["Lundi", "Mercredi", "Vendredi"])';
COMMENT ON COLUMN prestation.type_demande IS 'Regular or spot service';
COMMENT ON COLUMN prestation.point_depart_id IS 'Departure address reference';
COMMENT ON COLUMN prestation.point_arrivee_id IS 'Arrival address reference';
COMMENT ON COLUMN prestation.typologie_vehicule IS 'Required vehicle type';
COMMENT ON COLUMN prestation.energie_imposee IS 'Required fuel/energy type';
COMMENT ON COLUMN prestation.type_remorque IS 'Required trailer type';
COMMENT ON COLUMN prestation.sensible IS 'Sensitive cargo flag';
COMMENT ON COLUMN prestation.code_dechargement IS 'Unloading code if required';
