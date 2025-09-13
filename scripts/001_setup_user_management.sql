-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Create comprehensive RLS policies for profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    -- Users can view their own profile
    auth.uid() = id 
    OR 
    -- Super admins can view all profiles
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'Super Admin'
    )
  );

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (
    -- Super admins can create any profile
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'Super Admin'
    )
  );

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    -- Users can update their own profile
    auth.uid() = id 
    OR 
    -- Super admins can update any profile
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'Super Admin'
    )
  );

CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE USING (
    -- Super admins can delete any profile (except their own to prevent lockout)
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'Super Admin'
    ) AND auth.uid() != profiles.id
  );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, username, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'username', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'User'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
