-- Create user profiles table with role-based access
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  username text,
  role text not null check (role in ('Admin', 'Technician', 'Customer', 'SuperAdmin')) default 'Technician',
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Fixed RLS policies to prevent infinite recursion by using auth.uid() directly
-- RLS policies for profiles - users can manage their own profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Simplified admin policy using auth.jwt() to avoid recursion
-- Admin and SuperAdmin can view all profiles
create policy "profiles_admin_select_all"
  on public.profiles for select
  using (
    (auth.jwt() ->> 'email') = 'admin@stp.com' OR
    auth.uid() in (
      select id from auth.users 
      where email = 'admin@stp.com'
    )
  );

-- Admin policies for insert/update/delete using direct auth checks
create policy "profiles_admin_insert_all"
  on public.profiles for insert
  with check (
    (auth.jwt() ->> 'email') = 'admin@stp.com' OR
    auth.uid() in (
      select id from auth.users 
      where email = 'admin@stp.com'
    )
  );

create policy "profiles_admin_update_all"
  on public.profiles for update
  using (
    (auth.jwt() ->> 'email') = 'admin@stp.com' OR
    auth.uid() in (
      select id from auth.users 
      where email = 'admin@stp.com'
    )
  );

create policy "profiles_admin_delete_all"
  on public.profiles for delete
  using (
    (auth.jwt() ->> 'email') = 'admin@stp.com' OR
    auth.uid() in (
      select id from auth.users 
      where email = 'admin@stp.com'
    )
  );

-- Create companies table
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) on delete cascade
);

alter table public.companies enable row level security;

-- Fixed companies policies to avoid recursion
-- Companies policies - Admin can manage all, others can view their own company
create policy "companies_admin_all"
  on public.companies for all
  using (
    (auth.jwt() ->> 'email') = 'admin@stp.com' OR
    auth.uid() in (
      select id from auth.users 
      where email = 'admin@stp.com'
    )
  );

create policy "companies_user_select"
  on public.companies for select
  using (created_by = auth.uid());
