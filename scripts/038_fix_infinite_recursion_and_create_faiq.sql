-- Fix infinite recursion in RLS policies and create Faiq admin user
-- This script completely resets the profiles table and policies to work correctly

-- Step 1: Drop all existing policies that cause infinite recursion
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Step 2: Create simple, non-recursive policies
-- Allow service role (used by API) to do everything
CREATE POLICY "profiles_service_role_access"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow users to read all profiles (needed for user management)
CREATE POLICY "profiles_read_all"
  ON public.profiles FOR SELECT
  USING (true);

-- Allow users to update their own profile only
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 3: Grant proper permissions
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Step 4: Create the Faiq admin user
DO $$
DECLARE
    user_id uuid;
    existing_user_id uuid;
BEGIN
    -- Check if user already exists
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = 'faiq@internal.thinkquality.app';
    
    IF existing_user_id IS NULL THEN
        -- Create new auth user
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
        RETURNING id INTO user_id;
    ELSE
        -- Update existing user password
        UPDATE auth.users 
        SET encrypted_password = crypt('fnl786', gen_salt('bf')),
            updated_at = now()
        WHERE id = existing_user_id;
        user_id := existing_user_id;
    END IF;

    -- Create or update profile
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        username,
        role,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        'faiq@internal.thinkquality.app',
        'Faiq',
        'Donnelly',
        'Faiq',
        'Admin',
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = 'faiq@internal.thinkquality.app',
        first_name = 'Faiq',
        last_name = 'Donnelly',
        username = 'Faiq',
        role = 'Admin',
        updated_at = now();

    RAISE NOTICE 'Faiq admin user created/updated successfully';
    RAISE NOTICE 'Username: Faiq';
    RAISE NOTICE 'Password: fnl786';
    RAISE NOTICE 'Email: faiq@internal.thinkquality.app';
    RAISE NOTICE 'Role: Admin';
END $$;

-- Step 5: Verify the user was created
SELECT 'Created/Updated user:' as info;
SELECT 
    p.username,
    p.first_name,
    p.last_name,
    p.email,
    p.role,
    u.email as auth_email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.username = 'Faiq';
