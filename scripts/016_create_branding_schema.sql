-- Create company branding table
create table if not exists public.company_branding (
  id uuid primary key default gen_random_uuid(),
  company_name text unique not null,
  customer_logo_url text,
  primary_color text default '#3b82f6',
  secondary_color text default '#64748b',
  accent_color text default '#10b981',
  font_family text default 'Inter',
  custom_css text,
  show_powered_by boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.company_branding enable row level security;

-- RLS Policies for company branding
create policy "company_branding_admin_all"
  on public.company_branding for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "company_branding_view_own_company"
  on public.company_branding for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and company_name = company_branding.company_name
    )
  );

-- Insert default branding for STP Engineering
insert into public.company_branding (
  company_name,
  customer_logo_url,
  primary_color,
  secondary_color,
  accent_color
) values (
  'STP Engineering (Pty) LTD',
  '/images/stp-logo.png',
  '#1e40af',
  '#64748b',
  '#0ea5e9'
) on conflict (company_name) do nothing;

-- Function to update branding updated_at timestamp
create or replace function update_branding_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create trigger for updated_at
drop trigger if exists company_branding_updated_at on public.company_branding;
create trigger company_branding_updated_at
  before update on public.company_branding
  for each row
  execute function update_branding_updated_at();
