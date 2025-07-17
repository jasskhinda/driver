-- Add driver-specific fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_make TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_model TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_year INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_color TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS license_plate TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS driver_license_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_location JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0;

-- Add driver_id field to trips table to properly link trips to drivers
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES auth.users(id);

-- Add fields for trip management
ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_location JSONB;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS destination_location JSONB;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_location JSONB;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS actual_pickup_time TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS actual_dropoff_time TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_notes TEXT;

-- Create policies for drivers to view and update their assigned trips
CREATE POLICY "Drivers can view their assigned trips" 
ON trips FOR SELECT 
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their assigned trips" 
ON trips FOR UPDATE 
USING (auth.uid() = driver_id);

-- Policy to allow drivers to view trips that are pending (for acceptance)
CREATE POLICY "Drivers can view pending trips" 
ON trips FOR SELECT 
USING (
  status = 'pending' AND 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'driver'
);

-- Function to update driver stats after trip completion
CREATE OR REPLACE FUNCTION update_driver_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles 
    SET 
      total_trips = total_trips + 1,
      total_earnings = total_earnings + COALESCE(NEW.price, 0)
    WHERE id = NEW.driver_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_driver_stats_trigger
AFTER UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION update_driver_stats();