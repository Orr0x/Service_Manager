-- Backfill Activity Logs from existing data

-- Jobs Created
INSERT INTO activity_logs (tenant_id, action_type, entity_type, entity_id, details, created_at)
SELECT 
    tenant_id, 
    'created', 
    'job', 
    id, 
    jsonb_build_object('title', title), 
    created_at
FROM jobs
ON CONFLICT DO NOTHING;

-- Jobs Completed (approximate, using updated_at if status is completed)
INSERT INTO activity_logs (tenant_id, action_type, entity_type, entity_id, details, created_at)
SELECT 
    tenant_id, 
    'status_change', 
    'job', 
    id, 
    jsonb_build_object('title', title, 'status', 'Completed'), 
    updated_at
FROM jobs
WHERE status = 'Completed'
ON CONFLICT DO NOTHING;

-- Workers Created
INSERT INTO activity_logs (tenant_id, action_type, entity_type, entity_id, details, created_at)
SELECT 
    tenant_id, 
    'created', 
    'worker', 
    id, 
    jsonb_build_object('name', first_name || ' ' || last_name), 
    created_at
FROM workers
ON CONFLICT DO NOTHING;

-- Customers Created
INSERT INTO activity_logs (tenant_id, action_type, entity_type, entity_id, details, created_at)
SELECT 
    tenant_id, 
    'created', 
    'customer', 
    id, 
    jsonb_build_object('name', business_name), 
    created_at
FROM customers
ON CONFLICT DO NOTHING;

-- Invoices Created
INSERT INTO activity_logs (tenant_id, action_type, entity_type, entity_id, details, created_at)
SELECT 
    tenant_id, 
    'created', 
    'invoice', 
    id, 
    jsonb_build_object('invoice_number', invoice_number, 'amount', total_amount), 
    created_at
FROM invoices
ON CONFLICT DO NOTHING;


-- Fix Job Statuses: 'draft' -> 'Scheduled' if start_time is set
UPDATE jobs
SET status = 'Scheduled'
WHERE status = 'draft' AND start_time IS NOT NULL;
