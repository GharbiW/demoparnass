-- MAJ: Add client_id to prestation_template
-- Allows associating a SUP template with a specific client

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prestation_template' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE prestation_template
      ADD COLUMN client_id UUID REFERENCES client(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for lookups by client
CREATE INDEX IF NOT EXISTS idx_prestation_template_client
  ON prestation_template(client_id);

COMMENT ON COLUMN prestation_template.client_id IS 'Optional client association for the template';
