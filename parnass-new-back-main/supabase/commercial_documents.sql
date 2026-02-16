-- Migration: Create documents table for contract/prestation attachments
-- MCom-008: Support document upload on contracts and prestations

-- Create documents table
CREATE TABLE IF NOT EXISTS document (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to entity (contract or prestation)
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('contract', 'prestation')),
  entity_id UUID NOT NULL,
  
  -- Document metadata
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  
  -- Storage path in Supabase storage
  storage_path TEXT NOT NULL,
  storage_bucket VARCHAR(100) DEFAULT 'commercial-documents',
  
  -- Tracking
  uploaded_by UUID,
  uploaded_by_name VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_entity ON document(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_created_at ON document(created_at DESC);

-- Enable RLS
ALTER TABLE document ENABLE ROW LEVEL SECURITY;

-- RLS policy: allow all authenticated users (role checks in backend)
CREATE POLICY "Allow all for authenticated users" ON document
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_document_updated_at ON document;
CREATE TRIGGER trigger_document_updated_at
  BEFORE UPDATE ON document
  FOR EACH ROW
  EXECUTE FUNCTION update_document_updated_at();

-- Add comments
COMMENT ON TABLE document IS 'Stores document attachments for contracts and prestations';
COMMENT ON COLUMN document.entity_type IS 'Type of entity (contract or prestation)';
COMMENT ON COLUMN document.entity_id IS 'UUID of the linked contract or prestation';
COMMENT ON COLUMN document.storage_path IS 'Path to the file in Supabase storage';
