-- ============================================
-- Vehicle Cache Table
-- Stores vehicle data synchronized from MyRentCar API
-- ============================================

-- Create the vehicle_cache table
CREATE TABLE IF NOT EXISTS vehicle_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Data from MyRentCar API
  myrentcar_id INTEGER UNIQUE NOT NULL,
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
  
  -- Fields for manual data (not from API - will be shown underlined in UI)
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
  
  -- Metadata
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_myrentcar_id ON vehicle_cache(myrentcar_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_immatriculation ON vehicle_cache(immatriculation);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_status ON vehicle_cache(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_type ON vehicle_cache(type);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_energie ON vehicle_cache(energie);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_titulaire_id ON vehicle_cache(titulaire_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_category_code ON vehicle_cache(category_code);

-- Enable Row Level Security
ALTER TABLE vehicle_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read vehicle_cache"
ON vehicle_cache FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert vehicle_cache"
ON vehicle_cache FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update vehicle_cache"
ON vehicle_cache FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policy: Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete vehicle_cache"
ON vehicle_cache FOR DELETE
TO authenticated
USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vehicle_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_vehicle_cache_updated_at ON vehicle_cache;
CREATE TRIGGER trigger_update_vehicle_cache_updated_at
BEFORE UPDATE ON vehicle_cache
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_cache_updated_at();

-- Comment on table
COMMENT ON TABLE vehicle_cache IS 'Cache table for vehicle data synchronized from MyRentCar API';
COMMENT ON COLUMN vehicle_cache.myrentcar_id IS 'Unique ID from MyRentCar system';
COMMENT ON COLUMN vehicle_cache.type_code IS 'Vehicle type code from MyRentCar (e.g., TRAGO, PORGO)';
COMMENT ON COLUMN vehicle_cache.category_code IS 'Category code from MyRentCar for trailer compatibility';
COMMENT ON COLUMN vehicle_cache.semi_compatibles IS 'Array of compatible semi-trailer types';
COMMENT ON COLUMN vehicle_cache.equipements IS 'Array of equipment: Hayon, GPS, Frigo, ADR, etc.';
COMMENT ON COLUMN vehicle_cache.synced_at IS 'Last synchronization timestamp from MyRentCar';
