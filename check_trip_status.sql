-- Check current trip statuses to debug the accept issue
-- Run this in Supabase SQL editor to see what's happening

-- 1. Check all trips with their current status
SELECT 
  id,
  status,
  driver_id,
  pickup_location,
  dropoff_location,
  pickup_time,
  created_at,
  updated_at
FROM trips
WHERE status IN ('awaiting_driver_acceptance', 'rejected', 'upcoming', 'in_progress')
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check if there are any trips awaiting driver acceptance
SELECT COUNT(*) as awaiting_count
FROM trips
WHERE status = 'awaiting_driver_acceptance';

-- 3. Check rejected trips that might need to be reassigned
SELECT 
  id,
  status,
  driver_id,
  pickup_location,
  pickup_time
FROM trips
WHERE status = 'rejected'
ORDER BY updated_at DESC
LIMIT 10;

-- 4. Fix to allow accepting previously rejected trips
-- This modifies the accept_trip function to also work with rejected trips
DROP FUNCTION IF EXISTS public.accept_trip(UUID, UUID);

CREATE OR REPLACE FUNCTION public.accept_trip(
  trip_id UUID,
  driver_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INT;
BEGIN
  -- Update trip to in_progress when driver accepts
  -- Now also works for rejected trips (to allow reassignment)
  UPDATE trips t
  SET 
    status = 'in_progress',
    driver_id = accept_trip.driver_id,  -- Set the driver_id in case it was cleared
    actual_pickup_time = NOW(),
    updated_at = NOW()
  WHERE 
    t.id = accept_trip.trip_id
    AND (
      -- Original condition: awaiting acceptance with matching driver
      (t.status = 'awaiting_driver_acceptance' AND t.driver_id = accept_trip.driver_id)
      OR 
      -- New condition: rejected trips can be accepted by any driver
      (t.status = 'rejected')
      OR
      -- Also allow upcoming trips to be accepted
      (t.status = 'upcoming' AND t.driver_id = accept_trip.driver_id)
    );
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.accept_trip TO authenticated;