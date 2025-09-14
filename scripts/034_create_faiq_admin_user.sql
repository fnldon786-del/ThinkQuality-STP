-- Create Faiq admin user with specified credentials
-- This script creates both the auth user and profile records

DO $$
DECLARE
    new_user_id uuid;
    thinkquality_company_id uuid;
BEGIN
    -- First, ensure ThinkQuality company exists
    INSERT INTO companies (name, contact_email, created_at, updated_at)
    VALUES ('ThinkQuality', 'info@thinkquality.com', NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
    
    -- Get the ThinkQuality company ID
    SELECT id INTO thinkquality_company_id 
    FROM companies 
    WHERE name = 'ThinkQuality';
    
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Create the auth user record
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
        aud
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        'faiq@internal.thinkquality.app',
        crypt('fnl786', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"username": "Faiq", "first_name": "Faiq", "last_name": "Donnelly", "role": "Admin"}',
        false,
        'authenticated',
        'authenticated'
    ) ON CONFLICT (email) DO NOTHING;
    
    -- Create the profile record
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
        new_user_id,
        'Faiq',
        'Faiq',
        'Donnelly',
        'faiq@internal.thinkquality.app',
        'Admin',
        NOW(),
        NOW()
    ) ON CONFLICT (username) DO NOTHING;
    
    -- Output success message
    RAISE NOTICE 'Faiq admin user created successfully with ID: %', new_user_id;
    RAISE NOTICE 'Login credentials: Username: Faiq, Password: fnl786';
    RAISE NOTICE 'Email: faiq@internal.thinkquality.app';
    
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
