-- Create job card time entries table for detailed time tracking
create table if not exists public.job_card_time_entries (
  id uuid primary key default gen_random_uuid(),
  job_card_id uuid references public.job_cards(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration_minutes integer not null default 0,
  description text,
  created_by uuid references auth.users(id) not null default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.job_card_time_entries enable row level security;

-- RLS Policies for time entries
create policy "job_card_time_entries_admin_all"
  on public.job_card_time_entries for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Admin'
    )
  );

create policy "job_card_time_entries_technician_assigned"
  on public.job_card_time_entries for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Technician'
    ) and exists (
      select 1 from public.job_cards
      where id = job_card_time_entries.job_card_id and assigned_to = auth.uid()
    )
  );

create policy "job_card_time_entries_customer_view"
  on public.job_card_time_entries for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Customer'
    ) and exists (
      select 1 from public.job_cards
      where id = job_card_time_entries.job_card_id and customer_id = auth.uid()
    )
  );

-- Create storage bucket for job card attachments
insert into storage.buckets (id, name, public)
values ('job-card-attachments', 'job-card-attachments', true)
on conflict (id) do nothing;

-- Storage policies for job card attachments
create policy "job_card_attachments_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'job-card-attachments' and
    auth.role() = 'authenticated'
  );

create policy "job_card_attachments_view"
  on storage.objects for select
  using (
    bucket_id = 'job-card-attachments' and
    auth.role() = 'authenticated'
  );

create policy "job_card_attachments_delete"
  on storage.objects for delete
  using (
    bucket_id = 'job-card-attachments' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
