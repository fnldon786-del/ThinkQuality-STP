-- Create user profiles table with role-based access
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  -- Added username field for username-based login
  username text unique not null,
  full_name text,
  role text not null check (role in ('Admin', 'Technician', 'Customer')) default 'Technician',
  company_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on username for faster lookups
create index if not exists profiles_username_idx on public.profiles(username);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS policies for profiles
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

-- Admin can view all profiles
create policy "profiles_admin_select_all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

-- Allow public read access to username for login lookup
create policy "profiles_username_lookup"
  on public.profiles for select
  using (true);

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

-- Companies policies - Admin can manage all, others can view their own company
create policy "companies_admin_all"
  on public.companies for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "companies_user_select"
  on public.companies for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and company_name = companies.name
    )
  );

-- Insert super admin user data
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'stpadmin@system.local',
  crypt('12345678', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "Stpadmin", "full_name": "Super Administrator"}',
  false,
  'authenticated'
) on conflict (email) do nothing;

-- Insert super admin profile
insert into public.profiles (
  id,
  email,
  username,
  full_name,
  role,
  company_name
) 
select 
  id,
  'stpadmin@system.local',
  'Stpadmin',
  'Super Administrator',
  'Admin',
  'STP Engineering'
from auth.users 
where email = 'stpadmin@system.local'
on conflict (username) do nothing;
