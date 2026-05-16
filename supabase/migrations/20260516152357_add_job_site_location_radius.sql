ALTER TABLE public.job_sites
  ADD COLUMN IF NOT EXISTS location_radius_meters DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_radius_locked BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_sites_location_radius_range'
      AND conrelid = 'public.job_sites'::regclass
  ) THEN
    ALTER TABLE public.job_sites
      ADD CONSTRAINT job_sites_location_radius_range
      CHECK (location_radius_meters IS NULL OR location_radius_meters BETWEEN 10 AND 250)
      NOT VALID;
  END IF;
END $$;
