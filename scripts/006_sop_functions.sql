-- Function to generate SOP numbers
create or replace function generate_sop_number()
returns text
language plpgsql
as $$
declare
  new_number text;
  counter integer;
begin
  -- Get current year
  select 'SOP-' || to_char(now(), 'YYYY') || '-' into new_number;
  
  -- Get the next sequential number for this year
  select coalesce(max(cast(substring(sop_number from length(new_number) + 1) as integer)), 0) + 1
  into counter
  from public.sops
  where sop_number like new_number || '%';
  
  -- Format with leading zeros
  new_number := new_number || lpad(counter::text, 3, '0');
  
  return new_number;
end;
$$;

-- Function to update SOP updated_at timestamp
create or replace function update_sop_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create trigger for updated_at
drop trigger if exists sops_updated_at on public.sops;
create trigger sops_updated_at
  before update on public.sops
  for each row
  execute function update_sop_updated_at();

-- Function to track SOP usage
create or replace function track_sop_usage(sop_uuid uuid, job_card_uuid uuid default null)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.sop_usage (sop_id, user_id, job_card_id)
  values (sop_uuid, auth.uid(), job_card_uuid);
end;
$$;

-- Insert default categories
insert into public.sop_categories (name, description, color, created_by)
select 
  'Maintenance', 'General maintenance procedures', '#3B82F6',
  (select id from auth.users limit 1)
where not exists (select 1 from public.sop_categories where name = 'Maintenance');

insert into public.sop_categories (name, description, color, created_by)
select 
  'Safety', 'Safety procedures and protocols', '#EF4444',
  (select id from auth.users limit 1)
where not exists (select 1 from public.sop_categories where name = 'Safety');

insert into public.sop_categories (name, description, color, created_by)
select 
  'Quality Control', 'Quality assurance procedures', '#10B981',
  (select id from auth.users limit 1)
where not exists (select 1 from public.sop_categories where name = 'Quality Control');

insert into public.sop_categories (name, description, color, created_by)
select 
  'Installation', 'Equipment installation procedures', '#F59E0B',
  (select id from auth.users limit 1)
where not exists (select 1 from public.sop_categories where name = 'Installation');
