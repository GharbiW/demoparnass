-- Check if reference column exists in address table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'address' AND column_name = 'reference';
