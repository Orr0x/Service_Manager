ALTER TABLE public.job_sites
  ADD COLUMN IF NOT EXISTS coordinates_locked BOOLEAN NOT NULL DEFAULT false;
