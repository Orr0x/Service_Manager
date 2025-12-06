-- Add parking_info column to job_sites table
ALTER TABLE job_sites
ADD COLUMN IF NOT EXISTS parking_info TEXT;
