-- Add SuperAdmin role to the existing role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('Admin', 'Technician', 'Customer', 'SuperAdmin'));

-- Removed the problematic SuperAdmin RLS policy that caused infinite recursion
-- The admin policies in 001_create_auth_schema.sql already handle SuperAdmin access
-- by checking for admin@stp.com email directly

-- Note: The super admin user will be created automatically when they first sign up
-- with the email admin@stp.com through the normal authentication flow
