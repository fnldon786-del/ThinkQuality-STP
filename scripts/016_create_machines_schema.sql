-- Create machines table for customer equipment
CREATE TABLE IF NOT EXISTS public.machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_number text UNIQUE NOT NULL,
  name text NOT NULL,
  model text,
  serial_number text,
  manufacturer text,
  installation_date date,
  location text,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  qr_code text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('Active', 'Maintenance', 'Inactive')) DEFAULT 'Active',
  last_maintenance date,
  next_maintenance date,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create machine maintenance schedules table
CREATE TABLE IF NOT EXISTS public.machine_maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid REFERENCES public.machines(id) ON DELETE CASCADE NOT NULL,
  maintenance_type text NOT NULL,
  frequency_days integer NOT NULL,
  last_performed date,
  next_due date NOT NULL,
  assigned_technician uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create breakdown requests table
CREATE TABLE IF NOT EXISTS public.breakdown_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE NOT NULL,
  machine_id uuid REFERENCES public.machines(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  urgency text NOT NULL CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
  status text NOT NULL CHECK (status IN ('Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Submitted',
  reported_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  acknowledged_at timestamp with time zone,
  resolved_at timestamp with time zone,
  assigned_technician uuid REFERENCES auth.users(id),
  resolution_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakdown_requests ENABLE ROW LEVEL SECURITY;

-- Machines RLS Policies
CREATE POLICY "machines_admin_all"
  ON public.machines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin')
    )
  );

CREATE POLICY "machines_customer_own"
  ON public.machines FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "machines_technician_view"
  ON public.machines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Technician'
    )
  );

-- Maintenance Schedules RLS Policies
CREATE POLICY "maintenance_schedules_admin_all"
  ON public.machine_maintenance_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin')
    )
  );

CREATE POLICY "maintenance_schedules_customer_view"
  ON public.machine_maintenance_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.machines
      WHERE id = machine_maintenance_schedules.machine_id AND customer_id = auth.uid()
    )
  );

CREATE POLICY "maintenance_schedules_technician_assigned"
  ON public.machine_maintenance_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Technician'
    ) AND (assigned_technician = auth.uid() OR assigned_technician IS NULL)
  );

-- Breakdown Requests RLS Policies
CREATE POLICY "breakdown_requests_admin_all"
  ON public.breakdown_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin')
    )
  );

CREATE POLICY "breakdown_requests_customer_own"
  ON public.breakdown_requests FOR ALL
  USING (customer_id = auth.uid());

CREATE POLICY "breakdown_requests_technician_assigned"
  ON public.breakdown_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Technician'
    ) AND (assigned_technician = auth.uid() OR assigned_technician IS NULL)
  );

-- Function to generate QR code for machines
CREATE OR REPLACE FUNCTION generate_machine_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.qr_code := 'QR' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
  NEW.machine_number := 'M' || TO_CHAR(EXTRACT(YEAR FROM NOW()), 'YYYY') || LPAD(NEXTVAL('machine_sequence')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for machine numbers
CREATE SEQUENCE IF NOT EXISTS machine_sequence START 1;

-- Create trigger for QR code generation
DROP TRIGGER IF EXISTS generate_qr_code_trigger ON public.machines;
CREATE TRIGGER generate_qr_code_trigger
  BEFORE INSERT ON public.machines
  FOR EACH ROW
  EXECUTE FUNCTION generate_machine_qr_code();

-- Function to generate breakdown request numbers
CREATE OR REPLACE FUNCTION generate_breakdown_request_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'BR' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEXTVAL('breakdown_request_sequence')::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for breakdown request numbers
CREATE SEQUENCE IF NOT EXISTS breakdown_request_sequence START 1;

-- Create trigger for breakdown request numbers
DROP TRIGGER IF EXISTS generate_breakdown_request_number_trigger ON public.breakdown_requests;
CREATE TRIGGER generate_breakdown_request_number_trigger
  BEFORE INSERT ON public.breakdown_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_breakdown_request_number();
