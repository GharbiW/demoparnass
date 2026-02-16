-- ============================================
-- Sync Status Table
-- Tracks synchronization history for drivers and vehicles
-- ============================================

-- Create the sync_status table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sync_status_entity_type ON sync_status(entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_status_status ON sync_status(status);
CREATE INDEX IF NOT EXISTS idx_sync_status_started_at ON sync_status(started_at DESC);

-- Enable Row Level Security
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read sync_status"
ON sync_status FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert sync_status"
ON sync_status FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update sync_status"
ON sync_status FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE sync_status IS 'Tracks synchronization history for backoffice data';
COMMENT ON COLUMN sync_status.entity_type IS 'Type of entity being synced: drivers, vehicles, or all';
COMMENT ON COLUMN sync_status.records_synced IS 'Total number of records processed';
COMMENT ON COLUMN sync_status.records_created IS 'Number of new records created';
COMMENT ON COLUMN sync_status.records_updated IS 'Number of existing records updated';
