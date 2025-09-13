-- Create additional tables needed for full dashboard functionality

-- Companies table
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  logo_url text,
  contact_email text,
  contact_phone text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Machines table
create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  machine_id text unique not null,
  qr_code text unique not null,
  name text not null,
  model text,
  manufacturer text,
  location text,
  customer_id uuid references auth.users(id),
  installation_date date,
  last_maintenance_date date,
  next_maintenance_date date,
  status text check (status in ('Active', 'Inactive', 'Maintenance', 'Decommissioned')) default 'Active',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SOPs (Standard Operating Procedures) table
create table if not exists public.sops (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  content text not null,
  version text not null default '1.0',
  category text,
  machine_type text,
  created_by uuid references auth.users(id) not null,
  approved_by uuid references auth.users(id),
  approved_at timestamp with time zone,
  status text check (status in ('Draft', 'Under Review', 'Approved', 'Archived')) default 'Draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Check Sheets table
create table if not exists public.check_sheets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  machine_type text,
  frequency text check (frequency in ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually')),
  created_by uuid references auth.users(id) not null,
  status text check (status in ('Active', 'Inactive', 'Archived')) default 'Active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Check Sheet Items table
create table if not exists public.check_sheet_items (
  id uuid primary key default gen_random_uuid(),
  check_sheet_id uuid references public.check_sheets(id) on delete cascade not null,
  item_description text not null,
  item_type text check (item_type in ('Visual', 'Measurement', 'Test', 'Checklist')) default 'Visual',
  expected_value text,
  tolerance text,
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Fault Database table
create table if not exists public.faults (
  id uuid primary key default gen_random_uuid(),
  fault_code text unique not null,
  title text not null,
  description text not null,
  machine_type text,
  category text,
  severity text check (severity in ('Low', 'Medium', 'High', 'Critical')) default 'Medium',
  symptoms text,
  root_cause text,
  solution text not null,
  parts_required text,
  tools_required text,
  estimated_time_hours numeric,
  created_by uuid references auth.users(id) not null,
  verified_by uuid references auth.users(id),
  verified_at timestamp with time zone,
  status text check (status in ('Draft', 'Verified', 'Archived')) default 'Draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customer Requests table
create table if not exists public.customer_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique not null,
  title text not null,
  description text not null,
  priority text check (priority in ('Low', 'Medium', 'High', 'Urgent')) default 'Medium',
  status text check (status in ('Submitted', 'Under Review', 'Approved', 'In Progress', 'Completed', 'Rejected')) default 'Submitted',
  request_type text check (request_type in ('Maintenance', 'Repair', 'Installation', 'Consultation', 'Other')) default 'Maintenance',
  machine_id uuid references public.machines(id),
  requested_by uuid references auth.users(id) not null,
  assigned_to uuid references auth.users(id),
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all new tables
alter table public.companies enable row level security;
alter table public.machines enable row level security;
alter table public.sops enable row level security;
alter table public.check_sheets enable row level security;
alter table public.check_sheet_items enable row level security;
alter table public.faults enable row level security;
alter table public.customer_requests enable row level security;

-- Create RLS policies for all new tables (using non-recursive patterns)

-- Companies policies
create policy "companies_admin_all" on public.companies for all using (auth.jwt() ->> 'email' = 'admin@stp.com');
create policy "companies_read_all" on public.companies for select using (true);

-- Machines policies
create policy "machines_admin_all" on public.machines for all using (auth.jwt() ->> 'email' = 'admin@stp.com');
create policy "machines_customer_own" on public.machines for select using (customer_id = auth.uid());
create policy "machines_technician_read" on public.machines for select using (true);

-- SOPs policies
create policy "sops_admin_all" on public.sops for all using (auth.jwt() ->> 'email' = 'admin@stp.com');
create policy "sops_read_approved" on public.sops for select using (status = 'Approved');
create policy "sops_create_technician" on public.sops for insert with check (created_by = auth.uid());
create policy "sops_update_own" on public.sops for update using (created_by = auth.uid() and status = 'Draft');

-- Check Sheets policies
create policy "check_sheets_admin_all" on public.check_sheets for all using (auth.jwt() ->> 'email' = 'admin@stp.com');
create policy "check_sheets_read_active" on public.check_sheets for select using (status = 'Active');
create policy "check_sheets_create_technician" on public.check_sheets for insert with check (created_by = auth.uid());

-- Check Sheet Items policies
create policy "check_sheet_items_admin_all" on public.check_sheet_items for all using (auth.jwt() ->> 'email' = 'admin@stp.com');
create policy "check_sheet_items_read_all" on public.check_sheet_items for select using (true);

-- Faults policies
create policy "faults_admin_all" on public.faults for all using (auth.jwt() ->> 'email' = 'admin@stp.com');
create policy "faults_read_verified" on public.faults for select using (status = 'Verified');
create policy "faults_create_technician" on public.faults for insert with check (created_by = auth.uid());
create policy "faults_update_own" on public.faults for update using (created_by = auth.uid() and status = 'Draft');

-- Customer Requests policies
create policy "customer_requests_admin_all" on public.customer_requests for all using (auth.jwt() ->> 'email' = 'admin@stp.com');
create policy "customer_requests_customer_own" on public.customer_requests for all using (requested_by = auth.uid());
create policy "customer_requests_technician_assigned" on public.customer_requests for select using (assigned_to = auth.uid());
