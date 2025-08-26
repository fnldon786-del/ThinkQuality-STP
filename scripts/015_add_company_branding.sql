-- Add logo_url field to companies table for customer branding
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text;

-- Update companies table with sample data
INSERT INTO public.companies (name, address, phone, email, logo_url)
VALUES 
  ('STP Engineering', '123 Industrial Ave', '+27-11-123-4567', 'info@stp.com', '/images/stp-logo.png')
ON CONFLICT (name) DO UPDATE SET
  logo_url = EXCLUDED.logo_url;
