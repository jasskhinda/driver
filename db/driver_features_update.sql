-- Add driver feedback and signature fields to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_feedback TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_signature TEXT; -- Base64 encoded signature image
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_completed_at TIMESTAMPTZ;

-- Create vehicle checkoffs table
CREATE TABLE IF NOT EXISTS vehicle_checkoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES auth.users(id) NOT NULL,
  vehicle_id TEXT,
  checkoff_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Pre-trip inspection items
  exterior_condition BOOLEAN DEFAULT FALSE,
  tires_condition BOOLEAN DEFAULT FALSE,
  lights_working BOOLEAN DEFAULT FALSE,
  mirrors_clean BOOLEAN DEFAULT FALSE,
  windshield_clean BOOLEAN DEFAULT FALSE,
  fluid_levels BOOLEAN DEFAULT FALSE,
  brakes_working BOOLEAN DEFAULT FALSE,
  horn_working BOOLEAN DEFAULT FALSE,
  seatbelts_working BOOLEAN DEFAULT FALSE,
  emergency_equipment BOOLEAN DEFAULT FALSE,
  wheelchair_lift_working BOOLEAN DEFAULT FALSE,
  wheelchair_securements BOOLEAN DEFAULT FALSE,
  
  -- Interior cleanliness
  interior_clean BOOLEAN DEFAULT FALSE,
  seats_clean BOOLEAN DEFAULT FALSE,
  floor_clean BOOLEAN DEFAULT FALSE,
  
  -- Documentation
  registration_current BOOLEAN DEFAULT FALSE,
  insurance_current BOOLEAN DEFAULT FALSE,
  inspection_current BOOLEAN DEFAULT FALSE,
  
  -- Additional notes
  notes TEXT,
  issues_found TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on vehicle_checkoffs
ALTER TABLE vehicle_checkoffs ENABLE ROW LEVEL SECURITY;

-- Policies for vehicle_checkoffs
CREATE POLICY "Drivers can view their own checkoffs" 
ON vehicle_checkoffs FOR SELECT 
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create their own checkoffs" 
ON vehicle_checkoffs FOR INSERT 
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own checkoffs from today" 
ON vehicle_checkoffs FOR UPDATE 
USING (auth.uid() = driver_id AND checkoff_date = CURRENT_DATE);

CREATE POLICY "Dispatchers can view all checkoffs" 
ON vehicle_checkoffs FOR SELECT 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dispatcher'
);

-- Create index for performance
CREATE INDEX idx_vehicle_checkoffs_driver_date ON vehicle_checkoffs(driver_id, checkoff_date DESC);

-- Function to check if driver has completed vehicle checkoff today
CREATE OR REPLACE FUNCTION has_completed_vehicle_checkoff_today(driver_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vehicle_checkoffs 
    WHERE driver_id = driver_uuid 
    AND checkoff_date = CURRENT_DATE
    AND exterior_condition = TRUE
    AND tires_condition = TRUE
    AND lights_working = TRUE
    AND brakes_working = TRUE
    AND seatbelts_working = TRUE
  );
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at
CREATE TRIGGER update_vehicle_checkoffs_updated_at
BEFORE UPDATE ON vehicle_checkoffs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();