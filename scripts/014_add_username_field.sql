-- Add username field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- Create the super admin user with username
INSERT INTO public.profiles (id, email, username, full_name, role, company_name, phone)
SELECT 
  gen_random_uuid(),
  'stpadmin@stp.com',
  'Stpadmin',
  'Super Administrator',
  'SuperAdmin',
  'STP Engineering',
  '+1234567890'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE username = 'Stpadmin'
);

-- Update existing users to have usernames based on email prefix
UPDATE public.profiles 
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL;
