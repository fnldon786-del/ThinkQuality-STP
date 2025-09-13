-- Insert sample data for testing and demonstration

-- Insert sample companies
insert into public.companies (name, description, contact_email, contact_phone, address) values
('Acme Manufacturing', 'Industrial equipment manufacturing company', 'contact@acme-mfg.com', '+1-555-0101', '123 Industrial Blvd, Manufacturing City, MC 12345'),
('TechCorp Industries', 'Technology and automation solutions', 'info@techcorp.com', '+1-555-0102', '456 Tech Drive, Innovation Park, IP 67890')
on conflict (name) do nothing;

-- Insert sample machines (only if companies exist)
insert into public.machines (machine_id, qr_code, name, model, manufacturer, location, status, notes)
select 
  'MCH-001', 'QR-MCH-001', 'Hydraulic Press #1', 'HP-2000X', 'Acme Hydraulics', 'Production Floor A', 'Active', 'Primary production press'
where exists (select 1 from public.companies where name = 'Acme Manufacturing')
union all
select 
  'MCH-002', 'QR-MCH-002', 'Conveyor Belt System', 'CB-500', 'TechCorp Automation', 'Assembly Line 1', 'Active', 'Main assembly conveyor'
where exists (select 1 from public.companies where name = 'TechCorp Industries')
on conflict (machine_id) do nothing;

-- Insert sample SOPs
insert into public.sops (title, description, content, category, machine_type, created_by, status) values
('Daily Equipment Inspection', 'Standard daily inspection procedure for all equipment', 
'1. Visual inspection of equipment\n2. Check for leaks or damage\n3. Verify safety systems\n4. Document findings\n5. Report any issues immediately', 
'Maintenance', 'General', 
(select id from auth.users where email = 'admin@stp.com' limit 1), 'Approved'),
('Hydraulic System Maintenance', 'Monthly maintenance procedure for hydraulic systems', 
'1. Check hydraulic fluid levels\n2. Inspect hoses and connections\n3. Test pressure settings\n4. Clean filters\n5. Update maintenance log', 
'Maintenance', 'Hydraulic', 
(select id from auth.users where email = 'admin@stp.com' limit 1), 'Approved')
on conflict (title) do nothing;

-- Insert sample check sheets
insert into public.check_sheets (title, description, machine_type, frequency, created_by, status) values
('Daily Safety Check', 'Daily safety inspection checklist', 'General', 'Daily', 
(select id from auth.users where email = 'admin@stp.com' limit 1), 'Active'),
('Weekly Hydraulic Inspection', 'Weekly inspection for hydraulic equipment', 'Hydraulic', 'Weekly', 
(select id from auth.users where email = 'admin@stp.com' limit 1), 'Active')
on conflict (title) do nothing;

-- Insert sample check sheet items
insert into public.check_sheet_items (check_sheet_id, item_description, item_type, expected_value, order_index)
select cs.id, 'Emergency stop buttons functional', 'Test', 'Pass', 1
from public.check_sheets cs where cs.title = 'Daily Safety Check'
union all
select cs.id, 'Safety guards in place', 'Visual', 'Present', 2
from public.check_sheets cs where cs.title = 'Daily Safety Check'
union all
select cs.id, 'Hydraulic fluid level', 'Measurement', '75-100%', 1
from public.check_sheets cs where cs.title = 'Weekly Hydraulic Inspection'
union all
select cs.id, 'System pressure reading', 'Measurement', '2000-2200 PSI', 2
from public.check_sheets cs where cs.title = 'Weekly Hydraulic Inspection'
on conflict do nothing;

-- Insert sample faults
insert into public.faults (fault_code, title, description, machine_type, category, severity, symptoms, root_cause, solution, parts_required, tools_required, estimated_time_hours, created_by, status) values
('FAULT-001', 'Motor Overheating', 'Electric motor running too hot during operation', 'General', 'Electrical', 'Medium', 
'Motor housing hot to touch, unusual noise, reduced performance', 
'Blocked air vents, worn bearings, or electrical overload', 
'1. Check and clean air vents\n2. Inspect bearings for wear\n3. Verify electrical connections\n4. Replace bearings if necessary', 
'Motor bearings (if required)', 'Multimeter, bearing puller, cleaning supplies', 2.5,
(select id from auth.users where email = 'admin@stp.com' limit 1), 'Verified'),
('FAULT-002', 'Hydraulic Leak', 'Hydraulic fluid leaking from system', 'Hydraulic', 'Hydraulic', 'High', 
'Visible fluid on floor, low pressure readings, pump cycling frequently', 
'Worn seals, loose connections, or damaged hoses', 
'1. Identify leak source\n2. Replace worn seals or hoses\n3. Tighten loose connections\n4. Refill hydraulic fluid\n5. Test system pressure', 
'Hydraulic seals, hydraulic fluid', 'Seal kit, torque wrench, pressure gauge', 3.0,
(select id from auth.users where email = 'admin@stp.com' limit 1), 'Verified')
on conflict (fault_code) do nothing;
