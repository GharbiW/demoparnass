-- Commercial Module: Address Table Migration - Make Address One Line
-- Run this if you already have the address table

-- Step 1: Make address column nullable (if it's currently NOT NULL)
ALTER TABLE address ALTER COLUMN address DROP NOT NULL;

-- Step 2: Update the comment
COMMENT ON COLUMN address.address IS 'Full address as a single line (e.g., Rue Pierre Semard, 94380 Bonneuil-sur-Marne, France)';
