-- Create SOP categories table
create table if not exists public.sop_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  color text default '#3B82F6',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) on delete cascade not null
);

-- Create SOPs table
create table if not exists public.sops (
  id uuid primary key default gen_random_uuid(),
  sop_number text unique not null,
  title text not null,
  description text,
  category_id uuid references public.sop_categories(id),
  version text not null default '1.0',
  status text not null check (status in ('Draft', 'Under Review', 'Approved', 'Archived')) default 'Draft',
  content text not null,
  equipment_types text[], -- Array of equipment this SOP applies to
  safety_requirements text[],
  required_tools text[],
  estimated_time_minutes integer,
  difficulty_level text check (difficulty_level in ('Beginner', 'Intermediate', 'Advanced')) default 'Intermediate',
  created_by uuid references auth.users(id) on delete cascade not null,
  approved_by uuid references auth.users(id),
  approved_at timestamp with time zone,
  effective_date timestamp with time zone,
  review_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create SOP steps table for structured procedures
create table if not exists public.sop_steps (
  id uuid primary key default gen_random_uuid(),
  sop_id uuid references public.sops(id) on delete cascade not null,
  step_number integer not null,
  title text not null,
  description text not null,
  warning_notes text,
  image_url text,
  estimated_minutes integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create SOP attachments table
create table if not exists public.sop_attachments (
  id uuid primary key default gen_random_uuid(),
  sop_id uuid references public.sops(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  file_type text,
  file_size integer,
  uploaded_by uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create SOP usage tracking table
create table if not exists public.sop_usage (
  id uuid primary key default gen_random_uuid(),
  sop_id uuid references public.sops(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  accessed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  job_card_id uuid references public.job_cards(id) -- Optional link to job card
);

-- Enable RLS
alter table public.sop_categories enable row level security;
alter table public.sops enable row level security;
alter table public.sop_steps enable row level security;
alter table public.sop_attachments enable row level security;
alter table public.sop_usage enable row level security;

-- SOP Categories RLS Policies
create policy "sop_categories_admin_all"
  on public.sop_categories for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "sop_categories_read_all"
  on public.sop_categories for select
  using (true); -- All authenticated users can read categories

-- SOPs RLS Policies
create policy "sops_admin_all"
  on public.sops for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "sops_read_approved"
  on public.sops for select
  using (status = 'Approved' or created_by = auth.uid());

create policy "sops_technician_create"
  on public.sops for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('Admin', 'Technician')
    ) and created_by = auth.uid()
  );

create policy "sops_creator_update"
  on public.sops for update
  using (created_by = auth.uid() and status = 'Draft');

-- SOP Steps RLS Policies
create policy "sop_steps_admin_all"
  on public.sop_steps for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "sop_steps_read_approved"
  on public.sop_steps for select
  using (
    exists (
      select 1 from public.sops
      where id = sop_steps.sop_id and (status = 'Approved' or created_by = auth.uid())
    )
  );

create policy "sop_steps_creator_manage"
  on public.sop_steps for all
  using (
    exists (
      select 1 from public.sops
      where id = sop_steps.sop_id and created_by = auth.uid()
    )
  );

-- SOP Attachments RLS Policies
create policy "sop_attachments_admin_all"
  on public.sop_attachments for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "sop_attachments_read_approved"
  on public.sop_attachments for select
  using (
    exists (
      select 1 from public.sops
      where id = sop_attachments.sop_id and (status = 'Approved' or created_by = auth.uid())
    )
  );

create policy "sop_attachments_creator_manage"
  on public.sop_attachments for all
  using (
    exists (
      select 1 from public.sops
      where id = sop_attachments.sop_id and created_by = auth.uid()
    )
  );

-- SOP Usage RLS Policies
create policy "sop_usage_admin_all"
  on public.sop_usage for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "sop_usage_own_records"
  on public.sop_usage for all
  using (user_id = auth.uid());
