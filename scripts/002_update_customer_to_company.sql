-- Update machines table to use company_id instead of customer_id
ALTER TABLE machines RENAME COLUMN customer_id TO company_id;

-- Add company_id to profiles table to link users to companies
ALTER TABLE profiles ADD COLUMN company_id uuid REFERENCES companies(id);

-- Update any existing customer references in other tables
-- (customer_feedback and customer_requests seem to be separate entities, keeping them as is)

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_machines_company_id ON machines(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);

-- Update RLS policies if needed
DROP POLICY IF EXISTS "Users can view machines for their company" ON machines;
CREATE POLICY "Users can view machines for their company" ON machines
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert machines for their company" ON machines;
CREATE POLICY "Users can insert machines for their company" ON machines
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update machines for their company" ON machines;
CREATE POLICY "Users can update machines for their company" ON machines
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
