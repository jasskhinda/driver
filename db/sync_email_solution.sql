-- Permanent solution to sync email from auth.users to profiles table
-- This ensures email is always available in the profiles table

-- 1. First, sync all existing users' emails
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL
AND u.email IS NOT NULL;

-- 2. Create a function to handle email sync
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user is created in auth.users
  IF TG_OP = 'INSERT' THEN
    -- Update the profiles table with the email if profile exists
    UPDATE profiles
    SET email = NEW.email
    WHERE id = NEW.id
    AND (email IS NULL OR email = '');
  
  -- When a user's email is updated in auth.users
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only update if email actually changed
    IF OLD.email IS DISTINCT FROM NEW.email THEN
      UPDATE profiles
      SET email = NEW.email
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger on auth.users table
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_email();

-- 4. Create a function to ensure profile has email when created
CREATE OR REPLACE FUNCTION ensure_profile_has_email()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new profile doesn't have an email, get it from auth.users
  IF NEW.email IS NULL OR NEW.email = '' THEN
    SELECT email INTO NEW.email
    FROM auth.users
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger on profiles table
DROP TRIGGER IF EXISTS ensure_profile_email_trigger ON profiles;
CREATE TRIGGER ensure_profile_email_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION ensure_profile_has_email();

-- 6. Create a function that can be called to sync a specific user
CREATE OR REPLACE FUNCTION sync_single_user_email(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
  AND p.id = user_id
  AND u.email IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create a view that always shows the most current email
CREATE OR REPLACE VIEW user_profiles_with_current_email AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.full_name,
  p.phone_number,
  p.address,
  p.role,
  p.facility_id,
  COALESCE(p.email, u.email) as email,
  p.created_at,
  p.updated_at,
  u.email as auth_email,
  p.email as profile_email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- Grant appropriate permissions
GRANT SELECT ON user_profiles_with_current_email TO authenticated;
GRANT EXECUTE ON FUNCTION sync_single_user_email TO authenticated;

-- Add comment to explain the solution
COMMENT ON FUNCTION sync_user_email() IS 'Automatically syncs email from auth.users to profiles table when users are created or email is updated';
COMMENT ON FUNCTION ensure_profile_has_email() IS 'Ensures profile always has email from auth.users when profile is created or updated';
COMMENT ON VIEW user_profiles_with_current_email IS 'View that always shows current email from auth.users, with fallback to profiles.email';