-- Commercial Module: Migration - Add avatar_url to contact table
-- Run this migration if the contact table already exists without the avatar_url column

-- Add avatar_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contact' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE contact ADD COLUMN avatar_url TEXT;
        
        -- Add comment
        COMMENT ON COLUMN contact.avatar_url IS 'URL to contact avatar image in Supabase storage';
        
        RAISE NOTICE 'Column avatar_url added to contact table';
    ELSE
        RAISE NOTICE 'Column avatar_url already exists in contact table';
    END IF;
END $$;
