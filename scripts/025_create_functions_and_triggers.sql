-- Create useful functions and triggers for the application

-- Function to generate job card numbers
create or replace function generate_job_card_number()
returns text as $$
declare
  next_num integer;
  job_number text;
begin
  -- Get the next sequence number
  select coalesce(max(cast(substring(job_number from 5) as integer)), 0) + 1
  into next_num
  from public.job_cards
  where job_number ~ '^JOB-[0-9]+$';
  
  -- Format as JOB-XXXX
  job_number := 'JOB-' || lpad(next_num::text, 4, '0');
  
  return job_number;
end;
$$ language plpgsql;

-- Function to update timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at columns
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at_column();

create trigger update_companies_updated_at before update on public.companies
  for each row execute function update_updated_at_column();

create trigger update_machines_updated_at before update on public.machines
  for each row execute function update_updated_at_column();

create trigger update_job_cards_updated_at before update on public.job_cards
  for each row execute function update_updated_at_column();

create trigger update_sops_updated_at before update on public.sops
  for each row execute function update_updated_at_column();

create trigger update_check_sheets_updated_at before update on public.check_sheets
  for each row execute function update_updated_at_column();

create trigger update_faults_updated_at before update on public.faults
  for each row execute function update_updated_at_column();

create trigger update_customer_requests_updated_at before update on public.customer_requests
  for each row execute function update_updated_at_column();

create trigger update_customer_feedback_updated_at before update on public.customer_feedback
  for each row execute function update_updated_at_column();

-- Function to auto-generate job card numbers on insert
create or replace function set_job_card_number()
returns trigger as $$
begin
  if new.job_number is null or new.job_number = '' then
    new.job_number := generate_job_card_number();
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-generate job card numbers
create trigger set_job_card_number_trigger before insert on public.job_cards
  for each row execute function set_job_card_number();
