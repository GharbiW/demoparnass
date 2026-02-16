-- Migration: Extend document entity_type to support 'client'
-- Allow documents to be uploaded on client detail pages

-- Drop the existing CHECK constraint on entity_type
ALTER TABLE document DROP CONSTRAINT IF EXISTS document_entity_type_check;

-- Add updated CHECK constraint including 'client'
ALTER TABLE document ADD CONSTRAINT document_entity_type_check
  CHECK (entity_type IN ('contract', 'prestation', 'client'));

-- Update table comment
COMMENT ON COLUMN document.entity_type IS 'Type of entity (contract, prestation, or client)';
