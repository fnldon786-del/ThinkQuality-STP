-- Create Faiq admin user
-- This script creates both the auth user and profile for Faiq

-- First, create the auth user
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
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'faiq@internal.thinkquality.app',
  crypt('fnl786', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "Faiq"}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID we just created (or existing one)
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id FROM auth.users WHERE email = 'faiq@internal.thinkquality.app';
  
  -- Create or update the profile
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
    user_id,
    'Faiq',
    'Faiq',
    'Donnelly',
    'faiq@internal.thinkquality.app',
    'Admin',
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    username = 'Faiq',
    first_name = 'Faiq',
    last_name = 'Donnelly',
    email = 'faiq@internal.thinkquality.app',
    role = 'Admin',
    updated_at = now();
    
  RAISE NOTICE 'Faiq admin user created successfully with ID: %', user_id;
END $$;

-- Verify the user was created
SELECT 
  p.username,
  p.first_name,
  p.last_name,
  p.email,
  p.role,
  p.created_at
FROM profiles p
WHERE p.username = 'Faiq';
