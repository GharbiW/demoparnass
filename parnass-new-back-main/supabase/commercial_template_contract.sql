-- Migration: Add contract_id to prestation_template
-- Allows associating a SUP template with a contract (and implicitly a client)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prestation_template' AND column_name = 'contract_id'
  ) THEN
    ALTER TABLE prestation_template
      ADD COLUMN contract_id UUID REFERENCES contract(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for lookups by contract
CREATE INDEX IF NOT EXISTS idx_prestation_template_contract
  ON prestation_template(contract_id);

COMMENT ON COLUMN prestation_template.contract_id IS 'Optional contract association for the template';
