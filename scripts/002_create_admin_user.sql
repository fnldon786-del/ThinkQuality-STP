-- Create admin user with proper credentials
-- First, we need to insert into auth.users (this requires service role)
-- Then create the profile

-- Insert admin user into profiles table with known UUID
INSERT INTO public.profiles (
  id,
  email,
  username,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@thinkquality.com',
  'Stpadmin',
  'System',
  'Administrator',
  'SuperAdmin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Also create a backup admin with the old credentials for compatibility
INSERT INTO public.profiles (
  id,
  email,
  username,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'stpadmin@thinkquality.com',
  'Stpadmin',
  'STP',
  'Admin',
  'SuperAdmin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
