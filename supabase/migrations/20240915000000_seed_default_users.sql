-- Create Admin user if not exists
insert into auth.users (id, email, raw_user_meta_data)
select gen_random_uuid(), 'admin@thinkquality.internal', jsonb_build_object('role', 'Admin')
where not exists (
  select 1 from auth.users where email = 'admin@thinkquality.internal'
);

-- Create Technician user if not exists
insert into auth.users (id, email, raw_user_meta_data)
select gen_random_uuid(), 'technician@thinkquality.internal', jsonb_build_object('role', 'Technician')
where not exists (
  select 1 from auth.users where email = 'technician@thinkquality.internal'
);

-- Create Customer user if not exists
insert into auth.users (id, email, raw_user_meta_data)
select gen_random_uuid(), 'customer@thinkquality.internal', jsonb_build_object('role', 'Customer')
where not exists (
  select 1 from auth.users where email = 'customer@thinkquality.internal'
);

-- Ensure profiles table has matching entries
insert into public.profiles (id, username, first_name, last_name, email, role)
select id, 'admin', 'Admin', '', 'admin@thinkquality.internal', 'Admin'
from auth.users where email = 'admin@thinkquality.internal'
on conflict (id) do nothing;

insert into public.profiles (id, username, first_name, last_name, email, role)
select id, 'technician', 'Technician', '', 'technician@thinkquality.internal', 'Technician'
from auth.users where email = 'technician@thinkquality.internal'
on conflict (id) do nothing;

insert into public.profiles (id, username, first_name, last_name, email, role)
select id, 'customer', 'Customer', '', 'customer@thinkquality.internal', 'Customer'
from auth.users where email = 'customer@thinkquality.internal'
on conflict (id) do nothing;
