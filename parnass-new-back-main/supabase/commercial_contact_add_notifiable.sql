-- Add is_notifiable_exploitation column to contact table
-- This column indicates whether the contact should receive notifications for the exploitation module

ALTER TABLE contact
ADD COLUMN IF NOT EXISTS is_notifiable_exploitation BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN contact.is_notifiable_exploitation IS 'Indique si ce contact peut être utilisé pour les notifications en exploitation';
