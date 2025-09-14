-- Create ThinkQuality company and admin user Faiq
-- First, insert ThinkQuality company if it doesn't exist
INSERT INTO public.companies (name, description, contact_email, contact_phone, address)
VALUES (
  'ThinkQuality',
  'Quality management and maintenance solutions',
  'info@thinkquality.com',
  '+1-555-0200',
  '789 Quality Street, Excellence City, EC 54321'
)
ON CONFLICT (name) DO NOTHING;

-- Get the company ID for ThinkQuality
DO $$
DECLARE
    company_uuid uuid;
    user_uuid uuid;
BEGIN
    -- Get ThinkQuality company ID
    SELECT id INTO company_uuid FROM public.companies WHERE name = 'ThinkQuality';
    
    -- Create the auth user using admin functions
    -- Note: This requires admin privileges to execute
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
        'faiq@internal.thinkquality.app',
        crypt('12345678', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"username": "Faiq", "first_name": "Faiq", "last_name": "Donnelly", "role": "Admin"}',
        false,
        'authenticated'
    ) RETURNING id INTO user_uuid;
    
    -- Create the profile record
    INSERT INTO public.profiles (
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
        null, -- Don't store internal email in profile
        now(),
        now()
    );
    
    RAISE NOTICE 'Admin user Faiq created successfully with company ThinkQuality';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating admin user: %', SQLERRM;
END $$;
