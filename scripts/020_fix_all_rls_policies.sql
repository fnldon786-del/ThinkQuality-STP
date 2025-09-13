-- Fix all RLS policies to avoid infinite recursion
-- This script drops and recreates all policies with direct auth checks

-- Drop existing problematic policies
drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "profiles_own_profile" on public.profiles;
drop policy if exists "job_cards_admin_all" on public.job_cards;
drop policy if exists "job_cards_technician_assigned" on public.job_cards;
drop policy if exists "job_cards_technician_update" on public.job_cards;
drop policy if exists "job_cards_technician_create" on public.job_cards;
drop policy if exists "job_cards_customer_view" on public.job_cards;
drop policy if exists "job_card_tasks_admin_all" on public.job_card_tasks;
drop policy if exists "job_card_tasks_technician_assigned" on public.job_card_tasks;
drop policy if exists "job_card_tasks_customer_view" on public.job_card_tasks;
drop policy if exists "job_card_attachments_admin_all" on public.job_card_attachments;
drop policy if exists "job_card_attachments_technician_assigned" on public.job_card_attachments;
drop policy if exists "job_card_attachments_customer_view" on public.job_card_attachments;

-- Create new non-recursive policies for profiles table
create policy "profiles_admin_all_fixed"
  on public.profiles for all
  using (
    auth.jwt() ->> 'email' = 'admin@stp.com'
    or exists (
      select 1 from auth.users u
      where u.id = auth.uid() 
      and u.email = 'admin@stp.com'
    )
  );

create policy "profiles_own_profile_fixed"
  on public.profiles for all
  using (id = auth.uid());

-- Create new non-recursive policies for job cards
create policy "job_cards_admin_all_fixed"
  on public.job_cards for all
  using (
    auth.jwt() ->> 'email' = 'admin@stp.com'
    or exists (
      select 1 from auth.users u
      where u.id = auth.uid() 
      and u.email = 'admin@stp.com'
    )
  );

create policy "job_cards_technician_view_fixed"
  on public.job_cards for select
  using (
    assigned_to = auth.uid() 
    or created_by = auth.uid()
    or auth.jwt() ->> 'email' = 'admin@stp.com'
  );

create policy "job_cards_technician_update_fixed"
  on public.job_cards for update
  using (
    assigned_to = auth.uid()
    or auth.jwt() ->> 'email' = 'admin@stp.com'
  );

create policy "job_cards_technician_create_fixed"
  on public.job_cards for insert
  with check (
    created_by = auth.uid()
    or auth.jwt() ->> 'email' = 'admin@stp.com'
  );

create policy "job_cards_customer_view_fixed"
  on public.job_cards for select
  using (
    customer_id = auth.uid()
    or auth.jwt() ->> 'email' = 'admin@stp.com'
  );

-- Create new non-recursive policies for job card tasks
create policy "job_card_tasks_admin_all_fixed"
  on public.job_card_tasks for all
  using (
    auth.jwt() ->> 'email' = 'admin@stp.com'
    or exists (
      select 1 from auth.users u
      where u.id = auth.uid() 
      and u.email = 'admin@stp.com'
    )
  );

create policy "job_card_tasks_technician_assigned_fixed"
  on public.job_card_tasks for all
  using (
    exists (
      select 1 from public.job_cards jc
      where jc.id = job_card_tasks.job_card_id 
      and jc.assigned_to = auth.uid()
    )
    or auth.jwt() ->> 'email' = 'admin@stp.com'
  );

create policy "job_card_tasks_customer_view_fixed"
  on public.job_card_tasks for select
  using (
    exists (
      select 1 from public.job_cards jc
      where jc.id = job_card_tasks.job_card_id 
      and jc.customer_id = auth.uid()
    )
    or auth.jwt() ->> 'email' = 'admin@stp.com'
  );

-- Create new non-recursive policies for job card attachments
create policy "job_card_attachments_admin_all_fixed"
  on public.job_card_attachments for all
  using (
    auth.jwt() ->> 'email' = 'admin@stp.com'
    or exists (
      select 1 from auth.users u
      where u.id = auth.uid() 
      and u.email = 'admin@stp.com'
    )
  );

create policy "job_card_attachments_technician_assigned_fixed"
  on public.job_card_attachments for all
  using (
    exists (
      select 1 from public.job_cards jc
      where jc.id = job_card_attachments.job_card_id 
      and jc.assigned_to = auth.uid()
    )
    or auth.jwt() ->> 'email' = 'admin@stp.com'
  );

create policy "job_card_attachments_customer_view_fixed"
  on public.job_card_attachments for select
  using (
    exists (
      select 1 from public.job_cards jc
      where jc.id = job_card_attachments.job_card_id 
      and jc.customer_id = auth.uid()
    )
    or auth.jwt() ->> 'email' = 'admin@stp.com'
  );
