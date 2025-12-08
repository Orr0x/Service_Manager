-- Add customer_id to activity_logs
ALTER TABLE activity_logs 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Index for faster customer timeline queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_customer ON activity_logs(customer_id);
