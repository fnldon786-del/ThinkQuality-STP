-- Add SuperAdmin role to the existing role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('Admin', 'Technician', 'Customer', 'SuperAdmin'));

-- Create the super-user account
-- First, we need to insert into auth.users (this would normally be done via Supabase Auth)
-- For now, we'll create a profile that can be linked when the user signs up

-- Insert the super-user profile (will be linked when user signs up with this email)
INSERT INTO public.profiles (id, email, full_name, role, company_name, phone)
SELECT 
  gen_random_uuid(),
  'admin@stp.com',
  'Super Administrator',
  'SuperAdmin',
  'STP',
  '+1234567890'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'admin@stp.com'
);

-- Update RLS policies to allow SuperAdmin access to everything
CREATE POLICY "profiles_superadmin_all"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SuperAdmin'
    )
  );
