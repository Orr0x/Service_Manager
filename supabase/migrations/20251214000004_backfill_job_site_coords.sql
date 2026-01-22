-- Backfill coordinates for existing job sites to enable Navigation

-- 1. Specific update for "Main Office" (London)
UPDATE public.job_sites 
SET latitude = 51.5074, longitude = -0.1278 
WHERE name ILIKE '%Main Office%' OR address ILIKE '%London%' OR address ILIKE '%Business St%';

-- 2. Update "Acme HQ" (Los Angeles)
UPDATE public.job_sites 
SET latitude = 34.0522, longitude = -118.2437 
WHERE name ILIKE '%Acme HQ%' OR city ILIKE '%Innovation City%';

-- 3. Update "Beta Warehouse" (Dallas)
UPDATE public.job_sites 
SET latitude = 32.7767, longitude = -96.7970 
WHERE name ILIKE '%Beta Warehouse%' OR city ILIKE '%Manufacturing Town%';

-- 3b. Update "Stanton Road" (Burton-on-Trent)
UPDATE public.job_sites
SET latitude = 52.793261, longitude = -1.620208
WHERE address ILIKE '%stanton road%';

-- 4. Fallback: Assign random offsets near London for any remaining sites without coords
-- This ensures the UI doesn't break for random test data
UPDATE public.job_sites
SET 
  latitude = 51.5074 + (random() * 0.1 - 0.05),
  longitude = -0.1278 + (random() * 0.1 - 0.05)
WHERE latitude IS NULL OR longitude IS NULL;
