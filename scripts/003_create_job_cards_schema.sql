-- Create job cards table
create table if not exists public.job_cards (
  id uuid primary key default gen_random_uuid(),
  job_number text unique not null,
  title text not null,
  description text,
  priority text not null check (priority in ('Low', 'Medium', 'High', 'Critical')) default 'Medium',
  status text not null check (status in ('Draft', 'Assigned', 'In Progress', 'Completed', 'Cancelled')) default 'Draft',
  equipment_id text,
  equipment_name text,
  location text,
  estimated_hours numeric,
  actual_hours numeric,
  assigned_to uuid references auth.users(id),
  created_by uuid references auth.users(id) on delete cascade not null,
  customer_id uuid references auth.users(id),
  due_date timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create job card tasks table
create table if not exists public.job_card_tasks (
  id uuid primary key default gen_random_uuid(),
  job_card_id uuid references public.job_cards(id) on delete cascade not null,
  task_description text not null,
  is_completed boolean default false,
  completed_by uuid references auth.users(id),
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create job card attachments table
create table if not exists public.job_card_attachments (
  id uuid primary key default gen_random_uuid(),
  job_card_id uuid references public.job_cards(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  file_type text,
  uploaded_by uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.job_cards enable row level security;
alter table public.job_card_tasks enable row level security;
alter table public.job_card_attachments enable row level security;

-- Job Cards RLS Policies
-- Admin can see all job cards
create policy "job_cards_admin_all"
  on public.job_cards for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

-- Technicians can see assigned job cards and ones they created
create policy "job_cards_technician_assigned"
  on public.job_cards for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Technician'
    ) and (assigned_to = auth.uid() or created_by = auth.uid())
  );

-- Technicians can update assigned job cards
create policy "job_cards_technician_update"
  on public.job_cards for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Technician'
    ) and assigned_to = auth.uid()
  );

-- Technicians can create job cards
create policy "job_cards_technician_create"
  on public.job_cards for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Technician'
    ) and created_by = auth.uid()
  );

-- Customers can see their job cards
create policy "job_cards_customer_view"
  on public.job_cards for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Customer'
    ) and customer_id = auth.uid()
  );

-- Job Card Tasks RLS Policies
create policy "job_card_tasks_admin_all"
  on public.job_card_tasks for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "job_card_tasks_technician_assigned"
  on public.job_card_tasks for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Technician'
    ) and exists (
      select 1 from public.job_cards
      where id = job_card_tasks.job_card_id and assigned_to = auth.uid()
    )
  );

create policy "job_card_tasks_customer_view"
  on public.job_card_tasks for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Customer'
    ) and exists (
      select 1 from public.job_cards
      where id = job_card_tasks.job_card_id and customer_id = auth.uid()
    )
  );

-- Job Card Attachments RLS Policies
create policy "job_card_attachments_admin_all"
  on public.job_card_attachments for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "job_card_attachments_technician_assigned"
  on public.job_card_attachments for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Technician'
    ) and exists (
      select 1 from public.job_cards
      where id = job_card_attachments.job_card_id and assigned_to = auth.uid()
    )
  );

create policy "job_card_attachments_customer_view"
  on public.job_card_attachments for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Customer'
    ) and exists (
      select 1 from public.job_cards
      where id = job_card_attachments.job_card_id and customer_id = auth.uid()
    )
  );
