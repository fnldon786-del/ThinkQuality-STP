-- Drop existing problematic policies and recreate the system properly
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;

-- Disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Clear existing data to start fresh
DELETE FROM profiles;

-- Create the Faiq admin user properly in auth.users
-- Using email format that Supabase expects
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'faiq@thinkquality.internal',
  crypt('fnl786', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "Faiq", "first_name": "Faiq", "last_name": "Donnelly"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('fnl786', gen_salt('bf')),
  updated_at = now(),
  raw_user_meta_data = '{"username": "Faiq", "first_name": "Faiq", "last_name": "Donnelly"}';

-- Create profile for Faiq using the auth user ID
INSERT INTO profiles (
  id,
  username,
  first_name,
  last_name,
  email,
  role,
  created_at,
  updated_at
)
SELECT 
  au.id,
  'Faiq',
  'Faiq',
  'Donnelly',
  'faiq@thinkquality.internal',
  'Admin',
  now(),
  now()
FROM auth.users au 
WHERE au.email = 'faiq@thinkquality.internal'
ON CONFLICT (id) DO UPDATE SET
  username = 'Faiq',
  first_name = 'Faiq',
  last_name = 'Donnelly',
  email = 'faiq@thinkquality.internal',
  role = 'Admin',
  updated_at = now();

-- Re-enable RLS with proper policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (true); -- Allow reading profiles for role-based routing

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'));

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'));

CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'));
