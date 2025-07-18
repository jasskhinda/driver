-- Simple Email Sync Solution for Supabase
-- This ensures profiles table always has the user's email

-- 1. Sync all existing users first
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.email = '')
AND u.email IS NOT NULL;

-- 2. Create a function that syncs email when profile is created/updated
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- If email is empty, get it from auth.users
  IF NEW.email IS NULL OR NEW.email = '' THEN
    SELECT email INTO NEW.email
    FROM auth.users
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger to run the function
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON public.profiles;
CREATE TRIGGER sync_profile_email_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_email();

-- 4. Test the solution by checking if any profiles are missing emails
SELECT 
  COUNT(*) as profiles_without_email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.email IS NULL AND u.email IS NOT NULL;