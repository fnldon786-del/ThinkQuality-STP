-- Function to generate job card numbers
create or replace function generate_job_number()
returns text
language plpgsql
as $$
declare
  new_number text;
  counter integer;
begin
  -- Get current year and month
  select 'JC' || to_char(now(), 'YYYYMM') || '-' into new_number;
  
  -- Get the next sequential number for this month
  select coalesce(max(cast(substring(job_number from length(new_number) + 1) as integer)), 0) + 1
  into counter
  from public.job_cards
  where job_number like new_number || '%';
  
  -- Format with leading zeros
  new_number := new_number || lpad(counter::text, 4, '0');
  
  return new_number;
end;
$$;

-- Function to update job card updated_at timestamp
create or replace function update_job_card_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create trigger for updated_at
drop trigger if exists job_cards_updated_at on public.job_cards;
create trigger job_cards_updated_at
  before update on public.job_cards
  for each row
  execute function update_job_card_updated_at();
