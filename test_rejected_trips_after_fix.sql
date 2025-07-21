-- Test query to verify rejected trips will work after the fix
-- Run this AFTER running the fix_rejected_trips_final.sql

-- 1. Check if the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trips' 
AND column_name = 'rejected_by_driver_id'
AND table_schema = 'public';

-- 2. Check if index was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'trips' 
AND indexname = 'idx_trips_rejected_by_driver_id';

-- 3. Test the query that the driver app uses
SELECT id, status, driver_id, rejected_by_driver_id, pickup_address, destination_address, created_at
FROM trips 
WHERE status = 'rejected'
ORDER BY created_at DESC;

-- 4. Count rejected trips (should show the same 2 trips found earlier)
SELECT COUNT(*) as total_rejected_trips FROM trips WHERE status = 'rejected';