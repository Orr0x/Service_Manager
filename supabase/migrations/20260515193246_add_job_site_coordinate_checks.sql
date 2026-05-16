-- Prevent newly saved job-site coordinates from drifting outside real GPS ranges.
-- Existing bad rows must be corrected before these constraints can be validated.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_sites_latitude_range'
      AND conrelid = 'public.job_sites'::regclass
  ) THEN
    ALTER TABLE public.job_sites
      ADD CONSTRAINT job_sites_latitude_range
      CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_sites_longitude_range'
      AND conrelid = 'public.job_sites'::regclass
  ) THEN
    ALTER TABLE public.job_sites
      ADD CONSTRAINT job_sites_longitude_range
      CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
      NOT VALID;
  END IF;
END $$;
