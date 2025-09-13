-- Add time tracking tables for detailed time entries
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  job_card_id uuid references public.job_cards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone,
  duration_minutes integer,
  notes text,
  status text not null check (status in ('In Progress', 'Paused', 'Completed')) default 'In Progress',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add sign-offs table for digital approvals
create table if not exists public.job_card_signoffs (
  id uuid primary key default gen_random_uuid(),
  job_card_id uuid references public.job_cards(id) on delete cascade not null,
  signed_by uuid references auth.users(id) on delete cascade not null,
  signature_type text not null check (signature_type in ('Technician', 'Supervisor', 'Customer')) default 'Technician',
  signature_data text, -- Base64 encoded signature or approval text
  signed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text
);

-- Enable RLS
alter table public.time_entries enable row level security;
alter table public.job_card_signoffs enable row level security;

-- Time Entries RLS Policies
create policy "time_entries_admin_all"
  on public.time_entries for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "time_entries_own_records"
  on public.time_entries for all
  using (user_id = auth.uid());

create policy "time_entries_assigned_technician"
  on public.time_entries for select
  using (
    exists (
      select 1 from public.job_cards
      where id = time_entries.job_card_id and assigned_to = auth.uid()
    )
  );

-- Job Card Signoffs RLS Policies
create policy "signoffs_admin_all"
  on public.job_card_signoffs for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "signoffs_own_records"
  on public.job_card_signoffs for all
  using (signed_by = auth.uid());

create policy "signoffs_job_participants"
  on public.job_card_signoffs for select
  using (
    exists (
      select 1 from public.job_cards
      where id = job_card_signoffs.job_card_id 
      and (assigned_to = auth.uid() or customer_id = auth.uid() or created_by = auth.uid())
    )
  );
