-- Check existing users and companies
SELECT 'Existing companies:' as info;
SELECT id, name FROM companies WHERE name = 'ThinkQuality';

SELECT 'Existing profiles:' as info;
SELECT id, username, first_name, last_name, email, role FROM profiles;

SELECT 'Auth users:' as info;
SELECT id, email FROM auth.users;

-- Create ThinkQuality company if it doesn't exist
INSERT INTO companies (id, name, description, contact_email, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ThinkQuality',
  'Quality management and inspection services',
  'admin@thinkquality.com',
  now(),
  now()
) ON CONFLICT (name) DO NOTHING;

-- Get the company ID
DO $$
DECLARE
    company_uuid uuid;
    user_uuid uuid;
BEGIN
    -- Get ThinkQuality company ID
    SELECT id INTO company_uuid FROM companies WHERE name = 'ThinkQuality';
    
    -- Create the auth user first
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
        'faiq@thinkquality.com',
        crypt('12345678', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"username": "Faiq"}',
        false,
        'authenticated'
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('12345678', gen_salt('bf')),
        updated_at = now()
    RETURNING id INTO user_uuid;
    
    -- If user already exists, get their ID
    IF user_uuid IS NULL THEN
        SELECT id INTO user_uuid FROM auth.users WHERE email = 'faiq@thinkquality.com';
    END IF;
    
    -- Create or update the profile
    INSERT INTO profiles (
        id,
        username,
        first_name,
        last_name,
        email,
        role,
        created_at,
        updated_at
    ) VALUES (
        user_uuid,
        'Faiq',
        'Faiq',
        'Donnelly',
        'faiq@thinkquality.com',
        'Admin',
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        username = 'Faiq',
        first_name = 'Faiq',
        last_name = 'Donnelly',
        email = 'faiq@thinkquality.com',
        role = 'Admin',
        updated_at = now();
        
    RAISE NOTICE 'Admin user Faiq created/updated with ID: %', user_uuid;
END $$;
