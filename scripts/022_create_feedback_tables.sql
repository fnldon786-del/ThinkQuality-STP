-- Create customer feedback table
create table if not exists public.customer_feedback (
  id uuid primary key default gen_random_uuid(),
  feedback_type text not null check (feedback_type in ('issue', 'suggestion', 'compliment', 'complaint')),
  subject text not null,
  description text not null,
  rating integer check (rating >= 1 and rating <= 5),
  status text check (status in ('Open', 'In Review', 'Resolved', 'Closed')) default 'Open',
  submitted_by uuid references auth.users(id) not null,
  assigned_to uuid references auth.users(id),
  response text,
  responded_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create completed check sheets table
create table if not exists public.completed_check_sheets (
  id uuid primary key default gen_random_uuid(),
  check_sheet_id uuid references public.check_sheets(id) not null,
  completed_by uuid references auth.users(id) not null,
  machine_id uuid references public.machines(id),
  completion_date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('Completed', 'Incomplete', 'Failed')) default 'Completed',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create completed check sheet items table
create table if not exists public.completed_check_sheet_items (
  id uuid primary key default gen_random_uuid(),
  completed_check_sheet_id uuid references public.completed_check_sheets(id) on delete cascade not null,
  check_sheet_item_id uuid references public.check_sheet_items(id) not null,
  actual_value text,
  is_compliant boolean default true,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.customer_feedback enable row level security;
alter table public.completed_check_sheets enable row level security;
alter table public.completed_check_sheet_items enable row level security;

-- Customer Feedback policies
create policy "customer_feedback_admin_all" on public.customer_feedback for all using (auth.jwt() ->> 'email' = 'admin@stp.com');
create policy "customer_feedback_customer_own" on public.customer_feedback for all using (submitted_by = auth.uid());
create policy "customer_feedback_technician_assigned" on public.customer_feedback for select using (assigned_to = auth.uid());

-- Completed Check Sheets policies
create policy "completed_check_sheets_admin_all" on public.completed_check_sheets for all using (auth.jwt() ->> 'email' = 'admin@stp.com');
create policy "completed_check_sheets_technician_own" on public.completed_check_sheets for all using (completed_by = auth.uid());
create policy "completed_check_sheets_customer_view" on public.completed_check_sheets for select using (
  exists (
    select 1 from public.machines m
    where m.id = completed_check_sheets.machine_id 
    and m.customer_id = auth.uid()
  )
);

-- Completed Check Sheet Items policies
create policy "completed_check_sheet_items_admin_all" on public.completed_check_sheet_items for all using (auth.jwt() ->> 'email' = 'admin@stp.com');
create policy "completed_check_sheet_items_technician_own" on public.completed_check_sheet_items for all using (
  exists (
    select 1 from public.completed_check_sheets ccs
    where ccs.id = completed_check_sheet_items.completed_check_sheet_id 
    and ccs.completed_by = auth.uid()
  )
);
create policy "completed_check_sheet_items_customer_view" on public.completed_check_sheet_items for select using (
  exists (
    select 1 from public.completed_check_sheets ccs
    join public.machines m on m.id = ccs.machine_id
    where ccs.id = completed_check_sheet_items.completed_check_sheet_id 
    and m.customer_id = auth.uid()
  )
);
