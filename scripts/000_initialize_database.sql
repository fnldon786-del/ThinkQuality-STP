-- Initialize database with essential tables and admin user
-- This script sets up the minimum required structure for the application to work

-- Create user profiles table with role-based access
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  -- Added username field for username-based login
  username text unique not null,
  full_name text,
  role text not null check (role in ('Admin', 'Technician', 'Customer', 'SuperAdmin')) default 'Technician',
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
create policy if not exists "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy if not exists "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy if not exists "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy if not exists "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Admin can view all profiles
create policy if not exists "profiles_admin_select_all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('Admin', 'SuperAdmin')
    )
  );

-- Allow public read access to username and email for login lookup
create policy if not exists "profiles_username_lookup"
  on public.profiles for select
  using (true);

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user registration
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create admin user function
create or replace function create_admin_user()
returns void
language plpgsql
security definer
as $$
declare
  admin_user_id uuid;
begin
  -- Check if admin user already exists
  select id into admin_user_id
  from auth.users
  where email = 'stpadmin@system.local';

  -- If user doesn't exist, create it
  if admin_user_id is null then
    -- Generate a new UUID for the admin user
    admin_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      'stpadmin@system.local',
      crypt('1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"Stpadmin","full_name":"Super Administrator","role":"SuperAdmin","company_name":"STP Engineering"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Insert profile
    insert into public.profiles (
      id,
      email,
      username,
      full_name,
      role,
      company_name
    ) values (
      admin_user_id,
      'stpadmin@system.local',
      'Stpadmin',
      'Super Administrator',
      'SuperAdmin',
      'STP Engineering'
    );
  else
    -- Update existing profile to ensure correct data
    update public.profiles
    set 
      username = 'Stpadmin',
      role = 'SuperAdmin',
      company_name = 'STP Engineering',
      full_name = 'Super Administrator'
    where id = admin_user_id;
  end if;
end;
$$;

-- Execute the function to create admin user
select create_admin_user();

-- Drop the function after use
drop function create_admin_user();
