-- Check current trips table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'trips' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing actual_dropoff_time column if it doesn't exist
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS actual_dropoff_time TIMESTAMPTZ;

-- Also add actual_pickup_time if it doesn't exist (for consistency)
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS actual_pickup_time TIMESTAMPTZ;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'trips' 
AND table_schema = 'public'
AND column_name IN ('actual_pickup_time', 'actual_dropoff_time')
ORDER BY column_name;