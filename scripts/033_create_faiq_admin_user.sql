-- Create Faiq admin user
DO $$
DECLARE
    faiq_user_id uuid;
    company_id uuid;
BEGIN
    -- Check if ThinkQuality company exists, create if not
    SELECT id INTO company_id FROM public.companies WHERE name = 'ThinkQuality' LIMIT 1;
    
    IF company_id IS NULL THEN
        INSERT INTO public.companies (name, address, phone, email, created_at)
        VALUES ('ThinkQuality', '123 Business St', '+1234567890', 'info@thinkquality.com', NOW())
        RETURNING id INTO company_id;
        
        RAISE NOTICE 'Created ThinkQuality company with ID: %', company_id;
    ELSE
        RAISE NOTICE 'ThinkQuality company already exists with ID: %', company_id;
    END IF;

    -- Check if Faiq user already exists in auth.users
    SELECT id INTO faiq_user_id 
    FROM auth.users 
    WHERE email = 'faiq@internal.thinkquality.app' 
    LIMIT 1;
    
    IF faiq_user_id IS NOT NULL THEN
        RAISE NOTICE 'User with email faiq@internal.thinkquality.app already exists';
        
        -- Update the profile if it exists
        UPDATE public.profiles 
        SET 
            username = 'Faiq',
            first_name = 'Faiq',
            last_name = 'Donnelly',
            role = 'Admin',
            updated_at = NOW()
        WHERE id = faiq_user_id;
        
        RAISE NOTICE 'Updated existing profile for Faiq';
    ELSE
        -- Generate a new UUID for the user
        faiq_user_id := gen_random_uuid();
        
        -- Insert into auth.users (this simulates what Supabase admin API would do)
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data
        ) VALUES (
            faiq_user_id,
            'faiq@internal.thinkquality.app',
            crypt('12345678', gen_salt('bf')), -- Hash the password
            NOW(),
            NOW(),
            NOW(),
            '{"username": "Faiq", "first_name": "Faiq", "last_name": "Donnelly", "role": "Admin"}'::jsonb
        );
        
        -- Insert into profiles
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
            faiq_user_id,
            'faiq@internal.thinkquality.app',
            'Faiq',
            'Faiq',
            'Donnelly',
            'Admin',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created Faiq admin user with ID: %', faiq_user_id;
    END IF;
    
    -- Verify the user was created/updated
    SELECT id INTO faiq_user_id FROM public.profiles WHERE username = 'Faiq' LIMIT 1;
    
    IF faiq_user_id IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: Faiq user exists in profiles table with ID: %', faiq_user_id;
    ELSE
        RAISE NOTICE 'ERROR: Failed to create/find Faiq user in profiles table';
    END IF;
    
END $$;

-- Show the created user
SELECT 
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.role,
    p.email,
    p.created_at
FROM public.profiles p 
WHERE p.username = 'Faiq';
