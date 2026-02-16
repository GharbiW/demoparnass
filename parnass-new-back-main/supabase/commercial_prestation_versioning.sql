-- MCom-23: Prestation Versioning, Archiving & Scheduled Modifications
-- Adds soft-delete (archiving), version tracking, and scheduled modification support

-- =============================================
-- 1. Add versioning & archiving columns to prestation
-- =============================================

DO $$
BEGIN
  -- Status: active or archived (soft-delete)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prestation' AND column_name = 'status'
  ) THEN
    ALTER TABLE prestation ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    ALTER TABLE prestation ADD CONSTRAINT prestation_status_check
      CHECK (status IN ('active', 'archived'));
  END IF;

  -- Version number (increments on each modification)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prestation' AND column_name = 'version'
  ) THEN
    ALTER TABLE prestation ADD COLUMN version INTEGER DEFAULT 1;
  END IF;

  -- Archiving metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prestation' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE prestation ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prestation' AND column_name = 'archived_by'
  ) THEN
    ALTER TABLE prestation ADD COLUMN archived_by UUID;
  END IF;
END $$;

-- Backfill: ensure all existing prestations are active with version 1
UPDATE prestation SET status = 'active' WHERE status IS NULL;
UPDATE prestation SET version = 1 WHERE version IS NULL;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_prestation_status ON prestation(status);

-- =============================================
-- 2. Create prestation_version table
-- =============================================

CREATE TABLE IF NOT EXISTS prestation_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the parent prestation
  prestation_id UUID NOT NULL REFERENCES prestation(id) ON DELETE CASCADE,

  -- Version metadata
  version_number INTEGER NOT NULL,
  date_effet TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied', 'scheduled', 'cancelled')),

  -- Full snapshot of prestation fields at this version point
  -- Contains: frequence, type_demande, heure_depart, heure_arrivee, etapes,
  --           typologie_vehicule, energie_imposee, type_remorque, specificites,
  --           tarif, tarif_unite, type_tarif, etc.
  snapshot JSONB NOT NULL,

  -- Change tracking
  change_description TEXT,
  created_by UUID,
  created_by_name VARCHAR(255),

  -- When the scheduled version was actually applied (NULL until applied)
  applied_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_prestation_version_prestation
  ON prestation_version(prestation_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_prestation_version_scheduled
  ON prestation_version(status, date_effet)
  WHERE status = 'scheduled';

-- Comments
COMMENT ON TABLE prestation_version IS 'Version history and scheduled modifications for prestations';
COMMENT ON COLUMN prestation_version.snapshot IS 'JSONB snapshot of prestation fields at this version point';
COMMENT ON COLUMN prestation_version.date_effet IS 'When this version takes/took effect';
COMMENT ON COLUMN prestation_version.status IS 'applied = historical, scheduled = future, cancelled = discarded';
