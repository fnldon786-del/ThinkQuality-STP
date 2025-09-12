-- Create signatures table for digital signatures
create table if not exists public.signatures (
  id uuid primary key default gen_random_uuid(),
  signature_data text not null, -- Base64 encoded signature image
  signer_id uuid references auth.users(id) on delete cascade not null,
  signer_name text not null,
  signer_role text not null,
  signature_type text not null check (signature_type in ('job_card_completion', 'job_card_approval', 'sop_approval', 'check_sheet_completion', 'customer_signoff')),
  reference_id uuid not null, -- ID of the job card, SOP, or check sheet
  reference_type text not null check (reference_type in ('job_card', 'sop', 'check_sheet')),
  signed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create sign-off workflows table
create table if not exists public.sign_off_workflows (
  id uuid primary key default gen_random_uuid(),
  reference_id uuid not null,
  reference_type text not null check (reference_type in ('job_card', 'sop', 'check_sheet')),
  workflow_step text not null check (workflow_step in ('technician_completion', 'supervisor_approval', 'customer_signoff', 'final_approval')),
  required_role text not null check (required_role in ('Technician', 'Admin', 'Customer', 'SuperAdmin')),
  is_completed boolean default false,
  completed_by uuid references auth.users(id),
  signature_id uuid references public.signatures(id),
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add signature fields to existing tables
alter table public.job_cards 
add column if not exists technician_signature_id uuid references public.signatures(id),
add column if not exists supervisor_signature_id uuid references public.signatures(id),
add column if not exists customer_signature_id uuid references public.signatures(id),
add column if not exists requires_customer_signoff boolean default false,
add column if not exists requires_supervisor_approval boolean default false;

alter table public.sops
add column if not exists approved_by_signature_id uuid references public.signatures(id),
add column if not exists approval_required boolean default true;

-- Create check sheet completions table if it doesn't exist
create table if not exists public.check_sheet_completions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null, -- references check_sheet_templates
  completed_by uuid references auth.users(id) on delete cascade not null,
  completion_data jsonb, -- stores answers to check sheet questions
  signature_id uuid references public.signatures(id),
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.signatures enable row level security;
alter table public.sign_off_workflows enable row level security;
alter table public.check_sheet_completions enable row level security;

-- Signatures RLS Policies
create policy "signatures_admin_all"
  on public.signatures for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('Admin', 'SuperAdmin')
    )
  );

create policy "signatures_own_view"
  on public.signatures for select
  using (signer_id = auth.uid());

create policy "signatures_create_own"
  on public.signatures for insert
  with check (signer_id = auth.uid());

-- Sign-off workflows RLS Policies
create policy "sign_off_workflows_admin_all"
  on public.sign_off_workflows for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('Admin', 'SuperAdmin')
    )
  );

create policy "sign_off_workflows_participant_view"
  on public.sign_off_workflows for select
  using (
    completed_by = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = sign_off_workflows.required_role
    )
  );

-- Check sheet completions RLS Policies
create policy "check_sheet_completions_admin_all"
  on public.check_sheet_completions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('Admin', 'SuperAdmin')
    )
  );

create policy "check_sheet_completions_own"
  on public.check_sheet_completions for all
  using (completed_by = auth.uid());

-- Create indexes for performance
create index if not exists signatures_reference_idx on public.signatures(reference_id, reference_type);
create index if not exists signatures_signer_idx on public.signatures(signer_id);
create index if not exists sign_off_workflows_reference_idx on public.sign_off_workflows(reference_id, reference_type);
create index if not exists check_sheet_completions_template_idx on public.check_sheet_completions(template_id);
