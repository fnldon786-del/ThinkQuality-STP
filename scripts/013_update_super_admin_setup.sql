-- Update the super admin setup to work with the server action
-- Remove the old profile insert since it will be handled by the server action

-- Ensure SuperAdmin role is allowed
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('Admin', 'Technician', 'Customer', 'SuperAdmin'));

-- Add RLS policies for SuperAdmin access
DROP POLICY IF EXISTS "profiles_superadmin_all" ON public.profiles;
CREATE POLICY "profiles_superadmin_all"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SuperAdmin'
    )
  );

-- Add SuperAdmin policies to other tables
DROP POLICY IF EXISTS "job_cards_superadmin_all" ON public.job_cards;
CREATE POLICY "job_cards_superadmin_all"
  ON public.job_cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SuperAdmin'
    )
  );

DROP POLICY IF EXISTS "sops_superadmin_all" ON public.sops;
CREATE POLICY "sops_superadmin_all"
  ON public.sops FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SuperAdmin'
    )
  );

DROP POLICY IF EXISTS "check_sheet_templates_superadmin_all" ON public.check_sheet_templates;
CREATE POLICY "check_sheet_templates_superadmin_all"
  ON public.check_sheet_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SuperAdmin'
    )
  );

DROP POLICY IF EXISTS "faults_superadmin_all" ON public.faults;
CREATE POLICY "faults_superadmin_all"
  ON public.faults FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SuperAdmin'
    )
  );
