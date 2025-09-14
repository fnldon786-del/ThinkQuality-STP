-- First, let's check what users currently exist
SELECT 
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.role,
    p.email,
    c.name as company_name,
    p.created_at
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
ORDER BY p.created_at DESC;

-- Check if ThinkQuality company exists
SELECT id, name, contact_email FROM public.companies WHERE name ILIKE '%think%' OR name ILIKE '%quality%';

-- If no companies exist, create ThinkQuality
INSERT INTO public.companies (id, name, contact_email, address, description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ThinkQuality',
  'info@thinkquality.com',
  'ThinkQuality Headquarters',
  'Quality management and maintenance solutions',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Show the company ID for ThinkQuality
SELECT id, name FROM public.companies WHERE name = 'ThinkQuality';
