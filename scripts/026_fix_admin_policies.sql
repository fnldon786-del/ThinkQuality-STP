-- Fix RLS policies to allow admin user creation and management
-- This script fixes the infinite recursion issue and allows proper admin access

-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete_all" ON public.profiles;

-- Create simplified admin policies that work with service role key
-- These policies allow the service role (used by admin API) to manage all profiles
CREATE POLICY "profiles_service_role_all"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read their own profile
CREATE POLICY "profiles_users_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "profiles_users_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- Ensure the profiles table has proper constraints
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
