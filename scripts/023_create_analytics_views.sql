-- Create analytics views for reporting functionality

-- Job Card Analytics View
create or replace view public.job_card_analytics as
select 
  date_trunc('month', created_at) as month,
  status,
  count(*) as count,
  avg(actual_hours) as avg_hours,
  sum(case when status = 'Completed' then 1 else 0 end) as completed_count
from public.job_cards
group by date_trunc('month', created_at), status
order by month desc;

-- SOP Usage Analytics View
create or replace view public.sop_usage_analytics as
select 
  category,
  count(*) as total_sops,
  sum(case when status = 'Approved' then 1 else 0 end) as approved_sops,
  sum(case when status = 'Draft' then 1 else 0 end) as draft_sops
from public.sops
group by category
order by total_sops desc;

-- Check Sheet Compliance View
create or replace view public.check_sheet_compliance as
select 
  date_trunc('week', completion_date) as week,
  count(*) as total_completed,
  sum(case when status = 'Completed' then 1 else 0 end) as successful_completions,
  round(
    (sum(case when status = 'Completed' then 1 else 0 end)::numeric / count(*)) * 100, 2
  ) as approval_rate
from public.completed_check_sheets
group by date_trunc('week', completion_date)
order by week desc;

-- Fault Trends View
create or replace view public.fault_trends as
select 
  date_trunc('month', created_at) as month,
  severity,
  category,
  count(*) as fault_count
from public.faults
group by date_trunc('month', created_at), severity, category
order by month desc, fault_count desc;

-- Machine Status Summary View
create or replace view public.machine_status_summary as
select 
  status,
  count(*) as machine_count,
  round((count(*)::numeric / (select count(*) from public.machines)) * 100, 2) as percentage
from public.machines
group by status
order by machine_count desc;

-- User Activity Summary View
create or replace view public.user_activity_summary as
select 
  p.role,
  count(*) as user_count,
  count(case when p.created_at > current_date - interval '30 days' then 1 end) as new_users_30_days
from public.profiles p
group by p.role
order by user_count desc;
