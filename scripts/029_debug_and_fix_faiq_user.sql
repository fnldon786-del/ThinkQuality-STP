-- Debug and fix Faiq user login issue
-- This script will check existing data and create the user properly

-- First, let's see what companies exist
SELECT 'Companies in database:' as info;
SELECT id, name FROM companies;

-- Check if ThinkQuality company exists
SELECT 'ThinkQuality company check:' as info;
SELECT * FROM companies WHERE name = 'ThinkQuality';

-- Check if Faiq exists in profiles
SELECT 'Faiq in profiles table:' as info;
SELECT * FROM profiles WHERE username = 'Faiq';

-- Check if faiq@thinkquality.com exists in auth.users
SELECT 'Faiq in auth.users:' as info;
SELECT id, email, created_at FROM auth.users WHERE email = 'faiq@thinkquality.com';

-- Create ThinkQuality company if it doesn't exist
INSERT INTO companies (name, address, phone, email, created_at, updated_at)
SELECT 'ThinkQuality', '123 Business St', '+1234567890', 'info@thinkquality.com', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'ThinkQuality');

-- Get the company ID
DO $$
DECLARE
    company_uuid UUID;
    user_uuid UUID;
BEGIN
    -- Get ThinkQuality company ID
    SELECT id INTO company_uuid FROM companies WHERE name = 'ThinkQuality' LIMIT 1;
    
    -- Check if auth user exists, if not create it
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'faiq@thinkquality.com';
    
    IF user_uuid IS NULL THEN
        -- Create auth user
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'faiq@thinkquality.com',
            crypt('12345678', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO user_uuid;
        
        RAISE NOTICE 'Created auth user with ID: %', user_uuid;
    ELSE
        RAISE NOTICE 'Auth user already exists with ID: %', user_uuid;
    END IF;
    
    -- Delete existing profile if it exists (to avoid conflicts)
    DELETE FROM profiles WHERE username = 'Faiq' OR id = user_uuid;
    
    -- Create profile
    INSERT INTO profiles (
        id,
        username,
        full_name,
        email,
        role,
        company_name,
        created_at,
        updated_at
    ) VALUES (
        user_uuid,
        'Faiq',
        'Faiq Donnelly',
        'faiq@thinkquality.com',
        'Admin',
        'ThinkQuality',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Created profile for user: Faiq';
    
END $$;

-- Verify the user was created correctly
SELECT 'Final verification - Faiq profile:' as info;
SELECT id, username, full_name, email, role, company_name FROM profiles WHERE username = 'Faiq';

SELECT 'Final verification - Faiq auth user:' as info;
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'faiq@thinkquality.com';
