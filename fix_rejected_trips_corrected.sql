-- Step 1: Add rejected_by_driver_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trips' 
        AND column_name = 'rejected_by_driver_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE trips ADD COLUMN rejected_by_driver_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Step 2: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_rejected_by_driver_id 
ON trips(rejected_by_driver_id) 
WHERE rejected_by_driver_id IS NOT NULL;

-- Step 3: Update the reject_trip function
CREATE OR REPLACE FUNCTION public.reject_trip(
  trip_id UUID,
  driver_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INT;
BEGIN
  UPDATE trips t
  SET 
    status = 'rejected',
    driver_id = NULL,
    rejected_by_driver_id = reject_trip.driver_id,
    updated_at = NOW()
  WHERE 
    t.id = reject_trip.trip_id
    AND t.driver_id = reject_trip.driver_id
    AND t.status IN ('awaiting_driver_acceptance', 'upcoming');
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.reject_trip TO authenticated;