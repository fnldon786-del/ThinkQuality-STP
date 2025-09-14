-- Test script to create Faiq user directly
-- This will help us verify the user creation process

-- First, check if ThinkQuality company exists
DO $$
DECLARE
    company_uuid UUID;
    user_uuid UUID := gen_random_uuid();
BEGIN
    -- Get or create ThinkQuality company
    SELECT id INTO company_uuid FROM companies WHERE name = 'ThinkQuality' LIMIT 1;
    
    IF company_uuid IS NULL THEN
        INSERT INTO companies (id, name, description, contact_email, contact_phone, address, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'ThinkQuality',
            'Quality management and consulting services',
            'info@thinkquality.com',
            '+1-555-0123',
            '123 Quality Street, Business District',
            NOW(),
            NOW()
        )
        RETURNING id INTO company_uuid;
        
        RAISE NOTICE 'Created ThinkQuality company with ID: %', company_uuid;
    ELSE
        RAISE NOTICE 'ThinkQuality company already exists with ID: %', company_uuid;
    END IF;

    -- Check if Faiq user already exists
    IF EXISTS (SELECT 1 FROM profiles WHERE username = 'Faiq') THEN
        RAISE NOTICE 'User Faiq already exists, skipping creation';
    ELSE
        -- Create Faiq user profile directly (for testing)
        INSERT INTO profiles (
            id,
            username,
            first_name,
            last_name,
            role,
            company_id,
            email,
            created_at,
            updated_at
        ) VALUES (
            user_uuid,
            'Faiq',
            'Faiq',
            'Donnelly',
            'Admin',
            company_uuid,
            'faiq@thinkquality.com',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created Faiq user profile with ID: %', user_uuid;
        RAISE NOTICE 'NOTE: This is a profile-only user for testing. Use the admin interface to create a complete user with authentication.';
    END IF;
END $$;

-- Show current users
SELECT 
    p.username,
    p.first_name,
    p.last_name,
    p.role,
    c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
ORDER BY p.created_at DESC;
