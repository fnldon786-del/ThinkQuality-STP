-- Create Faiq admin user properly using the system's expected format
-- First, ensure ThinkQuality company exists
INSERT INTO public.companies (id, name, contact_email, address, description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ThinkQuality',
  'info@thinkquality.com',
  'ThinkQuality Headquarters',
  'Quality management and maintenance solutions',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Get the ThinkQuality company ID
DO $$
DECLARE
    company_uuid uuid;
    user_uuid uuid := gen_random_uuid();
    internal_email text := 'faiq@internal.thinkquality.app';
BEGIN
    -- Get ThinkQuality company ID
    SELECT id INTO company_uuid FROM public.companies WHERE name = 'ThinkQuality' LIMIT 1;
    
    -- Check if user already exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = internal_email) THEN
        -- Create auth user using admin function (simulated)
        -- Note: This would normally be done through the Supabase Admin API
        -- For now, we'll create the profile directly and let the admin create the auth user
        
        -- Create the profile record directly
        INSERT INTO public.profiles (
            id,
            username,
            first_name,
            last_name,
            email,
            role,
            company_id,
            created_at,
            updated_at
        ) VALUES (
            user_uuid,
            'Faiq',
            'Faiq',
            'Donnelly',
            NULL, -- Email is null for admin-created users
            'Admin',
            company_uuid,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Profile created for Faiq with ID: %', user_uuid;
        RAISE NOTICE 'Company ID: %', company_uuid;
        RAISE NOTICE 'NOTE: Auth user must be created through the admin interface or API';
    ELSE
        RAISE NOTICE 'User with email % already exists', internal_email;
    END IF;
END $$;

-- Display current users for verification
SELECT 
    p.username,
    p.first_name,
    p.last_name,
    p.role,
    c.name as company_name,
    p.created_at
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
ORDER BY p.created_at DESC;
