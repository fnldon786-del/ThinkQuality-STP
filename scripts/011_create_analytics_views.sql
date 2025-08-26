-- Analytics views and functions for reporting
CREATE OR REPLACE VIEW job_card_analytics AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  status,
  priority,
  assigned_to,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_completion_hours
FROM job_cards 
GROUP BY DATE_TRUNC('month', created_at), status, priority, assigned_to;

CREATE OR REPLACE VIEW sop_usage_analytics AS
SELECT 
  s.category,
  s.difficulty_level,
  COUNT(DISTINCT s.id) as total_sops,
  AVG(s.estimated_duration) as avg_duration
FROM sops s
GROUP BY s.category, s.difficulty_level;

CREATE OR REPLACE VIEW check_sheet_compliance AS
SELECT 
  DATE_TRUNC('week', cs.created_at) as week,
  ct.title as template_name,
  ct.frequency,
  COUNT(cs.id) as completed_count,
  COUNT(CASE WHEN cs.status = 'approved' THEN 1 END) as approved_count,
  ROUND(COUNT(CASE WHEN cs.status = 'approved' THEN 1 END) * 100.0 / COUNT(cs.id), 2) as approval_rate
FROM completed_check_sheets cs
JOIN check_sheet_templates ct ON cs.template_id = ct.id
GROUP BY DATE_TRUNC('week', cs.created_at), ct.title, ct.frequency;

CREATE OR REPLACE VIEW fault_trends AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  equipment_type,
  severity,
  COUNT(*) as fault_count,
  AVG(effectiveness_rating) as avg_effectiveness
FROM faults 
GROUP BY DATE_TRUNC('month', created_at), equipment_type, severity;

-- Function to get user productivity metrics
CREATE OR REPLACE FUNCTION get_user_productivity(user_id UUID, start_date DATE, end_date DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'job_cards_completed', (
      SELECT COUNT(*) FROM job_cards 
      WHERE assigned_to = user_id 
      AND status = 'completed' 
      AND created_at BETWEEN start_date AND end_date
    ),
    'check_sheets_completed', (
      SELECT COUNT(*) FROM completed_check_sheets 
      WHERE completed_by = user_id 
      AND created_at BETWEEN start_date AND end_date
    ),
    'faults_reported', (
      SELECT COUNT(*) FROM faults 
      WHERE reported_by = user_id 
      AND created_at BETWEEN start_date AND end_date
    ),
    'avg_job_completion_time', (
      SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)
      FROM job_cards 
      WHERE assigned_to = user_id 
      AND status = 'completed'
      AND created_at BETWEEN start_date AND end_date
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
