-- Create Admin user with password if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@thinkquality.internal') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@thinkquality.internal',
      crypt('admin123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      jsonb_build_object('role', 'Admin'),
      false,
      'authenticated'
    );
  END IF;
END $$;

-- Create Technician user with password if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'technician@thinkquality.internal') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'technician@thinkquality.internal',
      crypt('tech123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      jsonb_build_object('role', 'Technician'),
      false,
      'authenticated'
    );
  END IF;
END $$;

-- Create Customer user with password if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'customer@thinkquality.internal') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'customer@thinkquality.internal',
      crypt('customer123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      jsonb_build_object('role', 'Customer'),
      false,
      'authenticated'
    );
  END IF;
END $$;

-- Ensure profiles table has matching entries
INSERT INTO public.profiles (id, username, first_name, last_name, email, role)
SELECT id, 'admin', 'Admin', 'User', 'admin@thinkquality.internal', 'Admin'
FROM auth.users WHERE email = 'admin@thinkquality.internal'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, username, first_name, last_name, email, role)
SELECT id, 'technician', 'Technician', 'User', 'technician@thinkquality.internal', 'Technician'
FROM auth.users WHERE email = 'technician@thinkquality.internal'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, username, first_name, last_name, email, role)
SELECT id, 'customer', 'Customer', 'User', 'customer@thinkquality.internal', 'Customer'
FROM auth.users WHERE email = 'customer@thinkquality.internal'
ON CONFLICT (id) DO NOTHING;
