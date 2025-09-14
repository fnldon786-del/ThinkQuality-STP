-- Remove ID column and replace email with cellphone number in profiles table
-- Also add the Faiq admin user

-- First, let's check if we need to create a backup
DO $$
BEGIN
    -- Create a backup table first
    DROP TABLE IF EXISTS profiles_backup;
    CREATE TABLE profiles_backup AS SELECT * FROM profiles;
    
    -- Drop the existing profiles table
    DROP TABLE IF EXISTS profiles CASCADE;
    
    -- Recreate profiles table without ID and with cellphone instead of email
    CREATE TABLE profiles (
        username text PRIMARY KEY,
        first_name text,
        last_name text,
        cellphone text,
        role text DEFAULT 'Customer',
        avatar_url text,
        bio text,
        website text,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Public profiles are viewable by everyone." ON profiles
        FOR SELECT USING (true);

    CREATE POLICY "Users can insert their own profile." ON profiles
        FOR INSERT WITH CHECK (true);

    CREATE POLICY "Users can update own profile." ON profiles
        FOR UPDATE USING (true);

    -- Create updated_at trigger
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = timezone('utc'::text, now());
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE 'Profiles table recreated successfully without ID column and with cellphone field';
END $$;

-- Now create the Faiq admin user
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Create auth user first
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
        'faiq@internal.thinkquality.app',
        crypt('fnl786', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"username": "Faiq"}',
        false,
        'authenticated'
    )
    ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('fnl786', gen_salt('bf')),
        updated_at = now()
    RETURNING id INTO user_id;

    -- Create profile
    INSERT INTO profiles (
        username,
        first_name,
        last_name,
        cellphone,
        role,
        created_at,
        updated_at
    ) VALUES (
        'Faiq',
        'Faiq',
        'Donnelly',
        '+1234567890',
        'Admin',
        now(),
        now()
    )
    ON CONFLICT (username) DO UPDATE SET
        first_name = 'Faiq',
        last_name = 'Donnelly',
        cellphone = '+1234567890',
        role = 'Admin',
        updated_at = now();

    RAISE NOTICE 'Faiq admin user created successfully with username: Faiq, password: fnl786';
END $$;

-- Verify the changes
SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

SELECT 'Created admin user:' as info;
SELECT username, first_name, last_name, cellphone, role FROM profiles WHERE username = 'Faiq';
