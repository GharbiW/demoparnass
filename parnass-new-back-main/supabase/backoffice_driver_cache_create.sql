-- ============================================
-- Driver Cache Table
-- Stores driver data synchronized from Factorial API
-- ============================================

-- Create the driver_cache table
CREATE TABLE IF NOT EXISTS driver_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Data from Factorial API
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
  shift TEXT,  -- 'jour', 'nuit', 'full'
  available_weekends TEXT,  -- 'oui', 'non'
  
  -- Fields for manual data (not from API - will be shown underlined in UI)
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
  
  -- Metadata
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_driver_cache_factorial_id ON driver_cache(factorial_id);
CREATE INDEX IF NOT EXISTS idx_driver_cache_status ON driver_cache(status);
CREATE INDEX IF NOT EXISTS idx_driver_cache_team_name ON driver_cache(team_name);
CREATE INDEX IF NOT EXISTS idx_driver_cache_agence ON driver_cache(agence);
CREATE INDEX IF NOT EXISTS idx_driver_cache_name ON driver_cache(last_name, first_name);

-- Enable Row Level Security
ALTER TABLE driver_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read driver_cache"
ON driver_cache FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert driver_cache"
ON driver_cache FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update driver_cache"
ON driver_cache FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policy: Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete driver_cache"
ON driver_cache FOR DELETE
TO authenticated
USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_driver_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_driver_cache_updated_at ON driver_cache;
CREATE TRIGGER trigger_update_driver_cache_updated_at
BEFORE UPDATE ON driver_cache
FOR EACH ROW
EXECUTE FUNCTION update_driver_cache_updated_at();

-- Comment on table
COMMENT ON TABLE driver_cache IS 'Cache table for driver data synchronized from Factorial API';
COMMENT ON COLUMN driver_cache.factorial_id IS 'Unique ID from Factorial system';
COMMENT ON COLUMN driver_cache.shift IS 'Preferred shift: jour, nuit, or full';
COMMENT ON COLUMN driver_cache.permits IS 'Array of permit types: SPL, CM, VL';
COMMENT ON COLUMN driver_cache.certifications IS 'Array of certifications: ADR, APSAD P3, etc.';
COMMENT ON COLUMN driver_cache.synced_at IS 'Last synchronization timestamp from Factorial';
