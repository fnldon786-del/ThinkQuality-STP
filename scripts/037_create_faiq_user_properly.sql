-- First, let's check if the user exists and create it properly
DO $$
BEGIN
    -- Check if Faiq user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'Faiq@internal.thinkquality.app') THEN
        -- Create the auth user
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
            'Faiq@internal.thinkquality.app',
            crypt('fnl786', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
        
        RAISE NOTICE 'Created auth user for Faiq';
    ELSE
        RAISE NOTICE 'Auth user for Faiq already exists';
    END IF;
    
    -- Check if Faiq profile exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE username = 'Faiq') THEN
        -- Create the profile
        INSERT INTO profiles (
            username,
            first_name,
            last_name,
            role,
            cellphone,
            created_at,
            updated_at
        ) VALUES (
            'Faiq',
            'Faiq',
            'Donnelly',
            'Admin',
            '+1234567890',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created profile for Faiq';
    ELSE
        RAISE NOTICE 'Profile for Faiq already exists';
    END IF;
END $$;

-- Verify the user was created
SELECT 'Auth User:' as type, email, created_at FROM auth.users WHERE email = 'Faiq@internal.thinkquality.app'
UNION ALL
SELECT 'Profile:' as type, username || ' (' || role || ')', created_at FROM profiles WHERE username = 'Faiq';
