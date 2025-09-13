-- Create the initial super admin user
-- This script should be run after the auth schema is set up

-- First, let's create a function to safely create the super admin
CREATE OR REPLACE FUNCTION create_super_admin_if_not_exists()
RETURNS VOID AS $$
DECLARE
  super_admin_email TEXT := 'admin@thinkquality.com';
  super_admin_id UUID;
BEGIN
  -- Check if super admin already exists
  SELECT id INTO super_admin_id 
  FROM public.profiles 
  WHERE email = super_admin_email AND role = 'SuperAdmin';
  
  -- If super admin doesn't exist, we need to create one
  -- Note: In production, you would create this user through Supabase Auth
  -- This is just to set up the profile structure
  IF super_admin_id IS NULL THEN
    -- Insert a placeholder profile that can be claimed later
    INSERT INTO public.profiles (
      id,
      username,
      first_name,
      last_name,
      email,
      role,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'superadmin',
      'Super',
      'Admin',
      super_admin_email,
      'SuperAdmin',
      NOW(),
      NOW()
    ) ON CONFLICT (email) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_super_admin_if_not_exists();

-- Drop the function as it's no longer needed
DROP FUNCTION create_super_admin_if_not_exists();
