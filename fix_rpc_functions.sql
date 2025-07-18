-- Fix the accept_trip and reject_trip functions
-- The issue is ambiguous column references and wrong GET DIAGNOSTICS syntax

-- Drop and recreate accept_trip function with proper column qualification
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
  -- Use table alias to avoid ambiguous column references
  UPDATE trips t
  SET 
    status = 'in_progress',
    actual_pickup_time = NOW(),
    updated_at = NOW()
  WHERE 
    t.id = accept_trip.trip_id
    AND t.driver_id = accept_trip.driver_id  -- Use qualified names
    AND t.status = 'awaiting_driver_acceptance';
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate reject_trip function with proper column qualification
DROP FUNCTION IF EXISTS public.reject_trip(UUID, UUID);

CREATE OR REPLACE FUNCTION public.reject_trip(
  trip_id UUID,
  driver_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INT;
BEGIN
  -- Update trip to rejected and clear driver assignment
  -- Use table alias to avoid ambiguous column references
  UPDATE trips t
  SET 
    status = 'rejected',
    driver_id = NULL,
    updated_at = NOW()
  WHERE 
    t.id = reject_trip.trip_id
    AND t.driver_id = reject_trip.driver_id  -- Use qualified names
    AND t.status = 'awaiting_driver_acceptance';
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.accept_trip TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_trip TO authenticated;

-- Test the functions (optional - you can comment this out)
-- SELECT 'Functions recreated successfully' as status;