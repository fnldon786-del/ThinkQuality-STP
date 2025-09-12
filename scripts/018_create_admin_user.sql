-- Create admin user using Supabase Auth API approach
-- This script creates the admin user properly through the auth system

-- First, let's create a function to safely create the admin user
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

  -- If user doesn't exist, we need to create it manually
  if admin_user_id is null then
    -- Insert into auth.users (this should normally be done via Supabase Auth API)
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
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
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'stpadmin@system.local',
      crypt('1234', gen_salt('bf')),
      now(),
      null,
      null,
      '{"provider":"email","providers":["email"]}',
      '{"username":"Stpadmin","full_name":"Super Administrator","role":"SuperAdmin","company_name":"STP Engineering"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    returning id into admin_user_id;

    -- Insert profile (this should be handled by the trigger, but let's ensure it exists)
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
    )
    on conflict (id) do update set
      username = excluded.username,
      role = excluded.role,
      company_name = excluded.company_name;
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

-- Execute the function
select create_admin_user();

-- Drop the function after use
drop function create_admin_user();
