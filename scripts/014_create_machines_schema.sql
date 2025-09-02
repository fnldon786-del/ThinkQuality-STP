-- Create machines/equipment table
create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  machine_number text unique not null,
  name text not null,
  description text,
  model text,
  serial_number text,
  manufacturer text,
  installation_date date,
  location text,
  status text not null check (status in ('Active', 'Inactive', 'Maintenance', 'Decommissioned')) default 'Active',
  qr_code text unique not null, -- Unique QR code identifier
  qr_code_url text, -- URL for QR code image
  customer_company text not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create machine maintenance schedule table
create table if not exists public.machine_maintenance (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references public.machines(id) on delete cascade not null,
  maintenance_type text not null check (maintenance_type in ('Preventive', 'Corrective', 'Predictive', 'Emergency')),
  title text not null,
  description text,
  frequency_days integer, -- How often maintenance should occur
  last_performed date,
  next_due date not null,
  assigned_to uuid references auth.users(id),
  status text not null check (status in ('Scheduled', 'Overdue', 'In Progress', 'Completed', 'Cancelled')) default 'Scheduled',
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create machine breakdown history table
create table if not exists public.machine_breakdowns (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references public.machines(id) on delete cascade not null,
  job_card_id uuid references public.job_cards(id),
  breakdown_date timestamp with time zone not null,
  description text not null,
  cause text,
  resolution text,
  downtime_hours numeric,
  cost numeric,
  reported_by uuid references auth.users(id),
  resolved_by uuid references auth.users(id),
  status text not null check (status in ('Reported', 'Investigating', 'In Progress', 'Resolved', 'Closed')) default 'Reported',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.machines enable row level security;
alter table public.machine_maintenance enable row level security;
alter table public.machine_breakdowns enable row level security;

-- Machines RLS Policies
create policy "machines_admin_all"
  on public.machines for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "machines_customer_company"
  on public.machines for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and company_name = machines.customer_company
    )
  );

create policy "machines_technician_view"
  on public.machines for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Technician'
    )
  );

-- Machine Maintenance RLS Policies
create policy "machine_maintenance_admin_all"
  on public.machine_maintenance for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "machine_maintenance_customer_view"
  on public.machine_maintenance for select
  using (
    exists (
      select 1 from public.profiles p
      join public.machines m on m.customer_company = p.company_name
      where p.id = auth.uid() and m.id = machine_maintenance.machine_id
    )
  );

create policy "machine_maintenance_technician_assigned"
  on public.machine_maintenance for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Technician'
    ) and (assigned_to = auth.uid() or created_by = auth.uid())
  );

-- Machine Breakdowns RLS Policies
create policy "machine_breakdowns_admin_all"
  on public.machine_breakdowns for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "machine_breakdowns_customer_company"
  on public.machine_breakdowns for all
  using (
    exists (
      select 1 from public.profiles p
      join public.machines m on m.customer_company = p.company_name
      where p.id = auth.uid() and m.id = machine_breakdowns.machine_id
    )
  );

create policy "machine_breakdowns_technician_view"
  on public.machine_breakdowns for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Technician'
    )
  );

-- Function to generate QR code identifier
create or replace function generate_qr_code()
returns text as $$
begin
  return 'QR-' || upper(substring(gen_random_uuid()::text from 1 for 8));
end;
$$ language plpgsql;

-- Trigger to auto-generate QR code on machine insert
create or replace function set_machine_qr_code()
returns trigger as $$
begin
  if new.qr_code is null then
    new.qr_code := generate_qr_code();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_set_machine_qr_code
  before insert on public.machines
  for each row execute function set_machine_qr_code();
