-- Update super admin credentials
UPDATE auth.users 
SET encrypted_password = crypt('1234', gen_salt('bf'))
WHERE email = 'admin@stp.com';

-- Ensure the profile exists with correct username
INSERT INTO profiles (id, email, username, role, full_name, created_at, updated_at)
SELECT 
  id,
  email,
  'Stpadmin',
  'Admin',
  'Super Administrator',
  now(),
  now()
FROM auth.users 
WHERE email = 'admin@stp.com'
ON CONFLICT (id) DO UPDATE SET
  username = 'Stpadmin',
  role = 'Admin',
  full_name = 'Super Administrator',
  updated_at = now();
