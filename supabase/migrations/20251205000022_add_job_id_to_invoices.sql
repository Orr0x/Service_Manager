-- Add job_id to invoices table
ALTER TABLE invoices
ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_invoices_job_id ON invoices(job_id);
