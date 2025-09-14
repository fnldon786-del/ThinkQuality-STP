-- Create the Faiq admin user properly using Supabase auth
-- This script creates both the auth user and profile record

-- First, let's create the auth user using the admin client
-- Note: This needs to be done via the API, but we'll prepare the profile data

-- Insert the profile data for Faiq (the auth user will be created via API)
-- We'll use a known UUID for consistency
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
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'faiq@thinkquality.internal',
  crypt('fnl786', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "Faiq", "first_name": "Faiq", "last_name": "Donnelly", "role": "Admin"}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID for the profile creation
DO $$
DECLARE
    user_id uuid;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'faiq@thinkquality.internal';
    
    IF user_id IS NOT NULL THEN
        -- Insert the profile record
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
            'faiq@thinkquality.internal',
            'Admin',
            now(),
            now()
        ) ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            updated_at = now();
    END IF;
END $$;
