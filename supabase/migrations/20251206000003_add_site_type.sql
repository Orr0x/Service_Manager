-- Add site_type column to job_sites table
ALTER TABLE job_sites
ADD COLUMN IF NOT EXISTS site_type TEXT;
