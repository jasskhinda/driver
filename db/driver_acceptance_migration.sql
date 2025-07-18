-- Driver Acceptance Workflow Migration
-- This adds a new status for trips awaiting driver acceptance

-- Step 1: Add the new status (this won't break existing apps)
-- First, let's check what status values currently exist
-- SELECT DISTINCT status FROM trips ORDER BY status;

-- Step 2: Safe migration - add new status without breaking existing functionality
-- All existing 'in_progress' trips will continue to work
-- Only new trip assignments will use the new status

-- Step 3: Update any existing trips that are assigned but not started
-- This is optional - you can skip this if you don't want to affect existing trips
-- UPDATE trips 
-- SET status = 'awaiting_driver_acceptance'
-- WHERE status = 'in_progress' 
-- AND actual_pickup_time IS NULL 
-- AND driver_id IS NOT NULL;

-- Step 4: Create a function to safely transition trip statuses
CREATE OR REPLACE FUNCTION public.assign_trip_to_driver(
  trip_id UUID,
  driver_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  trip_updated BOOLEAN := FALSE;
BEGIN
  -- Update trip to awaiting driver acceptance
  UPDATE trips 
  SET 
    driver_id = assign_trip_to_driver.driver_id,
    status = 'awaiting_driver_acceptance',
    updated_at = NOW()
  WHERE 
    id = trip_id
    AND (status = 'pending' OR status = 'upcoming');
  
  GET DIAGNOSTICS trip_updated = FOUND;
  RETURN trip_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function for driver to accept trip
CREATE OR REPLACE FUNCTION public.accept_trip(
  trip_id UUID,
  driver_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  trip_updated BOOLEAN := FALSE;
BEGIN
  -- Update trip to in_progress when driver accepts
  UPDATE trips 
  SET 
    status = 'in_progress',
    actual_pickup_time = NOW(),
    updated_at = NOW()
  WHERE 
    id = trip_id
    AND driver_id = accept_trip.driver_id
    AND status = 'awaiting_driver_acceptance';
  
  GET DIAGNOSTICS trip_updated = FOUND;
  RETURN trip_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function for driver to reject trip
CREATE OR REPLACE FUNCTION public.reject_trip(
  trip_id UUID,
  driver_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  trip_updated BOOLEAN := FALSE;
BEGIN
  -- Update trip to rejected and clear driver assignment
  UPDATE trips 
  SET 
    status = 'rejected',
    driver_id = NULL,
    updated_at = NOW()
  WHERE 
    id = trip_id
    AND driver_id = reject_trip.driver_id
    AND status = 'awaiting_driver_acceptance';
  
  GET DIAGNOSTICS trip_updated = FOUND;
  RETURN trip_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.assign_trip_to_driver TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_trip TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_trip TO authenticated;

-- Step 7: Add helpful comments
COMMENT ON FUNCTION public.assign_trip_to_driver IS 'Assigns trip to driver with awaiting_driver_acceptance status';
COMMENT ON FUNCTION public.accept_trip IS 'Driver accepts assigned trip, changes status to in_progress';
COMMENT ON FUNCTION public.reject_trip IS 'Driver rejects assigned trip, changes status to rejected and clears driver_id';

-- Step 8: Create a view to help with status display
CREATE OR REPLACE VIEW public.trip_status_display AS
SELECT 
  id,
  status,
  driver_id,
  CASE 
    WHEN status = 'awaiting_driver_acceptance' THEN 'Waiting Driver Acceptance'
    WHEN status = 'in_progress' THEN 'In Progress'
    WHEN status = 'pending' THEN 'Pending'
    WHEN status = 'upcoming' THEN 'Upcoming'
    WHEN status = 'completed' THEN 'Completed'
    WHEN status = 'rejected' THEN 'Rejected'
    ELSE status
  END as display_status
FROM trips;

GRANT SELECT ON public.trip_status_display TO authenticated;