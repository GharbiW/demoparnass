-- Commercial Module: Prestation Template Table
-- Creates the prestation_template table for storing reusable prestation templates
-- Templates can be used by conception and exploitation modules to quickly create prestations

CREATE TABLE IF NOT EXISTS prestation_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    
    -- Template identification
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Schedule (same as prestation)
    frequence JSONB DEFAULT '[]'::JSONB,
    type_demande VARCHAR(50) DEFAULT 'Régulière' CHECK (type_demande IN ('Régulière', 'Spot', 'MAD')),
    heure_depart TIME,
    heure_arrivee TIME,
    
    -- Locations - Array of step objects with metadata
    -- Each step: { address_id, heure_depart, heure_arrivee, vide, comment }
    etapes JSONB[] DEFAULT '{}',
    
    -- Vehicle requirements (mandatory for prestations)
    typologie_vehicule VARCHAR(50) CHECK (typologie_vehicule IN ('VL', 'SPL', 'CM', 'Caisse Mobile')),
    energie_imposee VARCHAR(50) CHECK (energie_imposee IN ('Gazole', 'Elec', 'Gaz')),
    type_remorque VARCHAR(50) CHECK (type_remorque IN ('Frigo', 'Hayon', 'Aérienne', 'Plateau', 'Tautliner', 'Benne', 'Fourgon', 'Savoyarde', 'Citerne')),
    
    -- Equipment specificities (multi-select array)
    specificites TEXT[],
    
    -- Additional flags
    sensible BOOLEAN DEFAULT FALSE,
    code_dechargement VARCHAR(50),
    comment TEXT,
    
    -- Mileage (for MAD type)
    kilometrage_prevu INTEGER,
    
    -- Pricing
    type_tarif VARCHAR(50) CHECK (type_tarif IN ('forfaitaire', 'terme_kilometrique', 'taux_horaire')),
    tarif DECIMAL(10, 2),
    tarif_unite VARCHAR(50),
    
    -- Ride details storage
    -- When include_ride_details is true, ride_details contains stored ride information
    include_ride_details BOOLEAN DEFAULT FALSE,
    ride_details JSONB DEFAULT '[]'::JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_prestation_template_reference ON prestation_template(reference);
CREATE INDEX IF NOT EXISTS idx_prestation_template_name ON prestation_template(name);
CREATE INDEX IF NOT EXISTS idx_prestation_template_category ON prestation_template(category);
CREATE INDEX IF NOT EXISTS idx_prestation_template_type_demande ON prestation_template(type_demande);

-- Function to auto-generate template reference
CREATE OR REPLACE FUNCTION generate_prestation_template_reference()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'TPL-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num
    FROM prestation_template;
    
    new_reference := 'TPL-' || LPAD(next_num::TEXT, 6, '0');
    NEW.reference := new_reference;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference on insert
DROP TRIGGER IF EXISTS trigger_generate_prestation_template_reference ON prestation_template;
CREATE TRIGGER trigger_generate_prestation_template_reference
    BEFORE INSERT ON prestation_template
    FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_prestation_template_reference();

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_prestation_template_updated_at ON prestation_template;
CREATE TRIGGER trigger_prestation_template_updated_at
    BEFORE UPDATE ON prestation_template
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE prestation_template ENABLE ROW LEVEL SECURITY;

-- RLS policy: Allow authenticated users to read
CREATE POLICY "prestation_template_select_policy" ON prestation_template
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- RLS policy: Allow authenticated users to insert
CREATE POLICY "prestation_template_insert_policy" ON prestation_template
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policy: Allow authenticated users to update
CREATE POLICY "prestation_template_update_policy" ON prestation_template
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- RLS policy: Allow authenticated users to delete
CREATE POLICY "prestation_template_delete_policy" ON prestation_template
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Comments
COMMENT ON TABLE prestation_template IS 'Reusable prestation templates for quick prestation creation';
COMMENT ON COLUMN prestation_template.reference IS 'Auto-generated unique reference (TPL-XXXXXX)';
COMMENT ON COLUMN prestation_template.name IS 'Display name of the template';
COMMENT ON COLUMN prestation_template.description IS 'Optional description of the template';
COMMENT ON COLUMN prestation_template.category IS 'Category for organizing templates';
COMMENT ON COLUMN prestation_template.frequence IS 'JSON array of days (e.g., ["Lundi", "Mercredi", "Vendredi"])';
COMMENT ON COLUMN prestation_template.type_demande IS 'Service type: Régulière, Spot, or MAD';
COMMENT ON COLUMN prestation_template.etapes IS 'Array of step objects: { address_id, heure_depart, heure_arrivee, vide, comment }';
COMMENT ON COLUMN prestation_template.typologie_vehicule IS 'Required vehicle type';
COMMENT ON COLUMN prestation_template.energie_imposee IS 'Required fuel/energy type';
COMMENT ON COLUMN prestation_template.type_remorque IS 'Required trailer type';
COMMENT ON COLUMN prestation_template.specificites IS 'Equipment specificities array';
COMMENT ON COLUMN prestation_template.sensible IS 'Sensitive cargo flag';
COMMENT ON COLUMN prestation_template.include_ride_details IS 'Whether to store and copy ride-specific details';
COMMENT ON COLUMN prestation_template.ride_details IS 'Stored ride details (times, comments) when include_ride_details is true';
