-- Email Sync Migration
-- Run this script in Supabase SQL Editor to set up automatic email syncing

-- Step 1: Sync all existing emails (run this first)
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL
AND u.email IS NOT NULL;

-- Step 2: Create function to handle profile email sync
CREATE OR REPLACE FUNCTION public.handle_profile_email_sync()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- For new profiles or profiles without email, get email from auth.users
  IF (TG_OP = 'INSERT' AND (NEW.email IS NULL OR NEW.email = '')) OR 
     (TG_OP = 'UPDATE' AND (NEW.email IS NULL OR NEW.email = '')) THEN
    
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.id;
    
    IF user_email IS NOT NULL THEN
      NEW.email := user_email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger on profiles table
DROP TRIGGER IF EXISTS profile_email_sync_trigger ON public.profiles;
CREATE TRIGGER profile_email_sync_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_email_sync();

-- Step 4: Create function to handle auth.users email updates
CREATE OR REPLACE FUNCTION public.handle_auth_email_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profiles table when auth.users email changes
  IF TG_OP = 'UPDATE' AND OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger on auth.users table needs to be created by a Supabase admin
-- You may need to contact Supabase support or use their dashboard to create this trigger:
-- 
-- CREATE TRIGGER auth_email_update_trigger
-- AFTER UPDATE OF email ON auth.users
-- FOR EACH ROW
-- EXECUTE FUNCTION public.handle_auth_email_update();

-- Step 5: Create a helper function to manually sync a user's email
CREATE OR REPLACE FUNCTION public.sync_user_email(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  rows_updated INT;
BEGIN
  UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
  AND p.id = user_id
  AND u.email IS NOT NULL;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.sync_user_email TO authenticated;

-- Step 6: Verify the setup
-- Run this query to check for any profiles still missing emails:
-- SELECT p.id, p.full_name, p.email as profile_email, u.email as auth_email
-- FROM profiles p
-- LEFT JOIN auth.users u ON p.id = u.id
-- WHERE p.email IS NULL AND u.email IS NOT NULL;