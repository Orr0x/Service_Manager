-- Idempotent Search Index Fix
-- Run this in Supabase SQL Editor to ensure ALL tables have the search column

-- 1. Checklists
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))) STORED;
CREATE INDEX IF NOT EXISTS checklists_search_idx ON checklists USING GIN (search_vector);

-- 2. Jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;
CREATE INDEX IF NOT EXISTS jobs_search_idx ON jobs USING GIN (search_vector);

-- 3. Job Sites
ALTER TABLE job_sites ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(address, '') || ' ' || coalesce(city, ''))) STORED;
CREATE INDEX IF NOT EXISTS job_sites_search_idx ON job_sites USING GIN (search_vector);

-- 4. Contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(type, '') || ' ' || coalesce(status, ''))) STORED;
CREATE INDEX IF NOT EXISTS contracts_search_idx ON contracts USING GIN (search_vector);

-- 5. Workers
ALTER TABLE workers ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(role, ''))) STORED;
CREATE INDEX IF NOT EXISTS workers_search_idx ON workers USING GIN (search_vector);

-- 6. Services
ALTER TABLE services ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, ''))) STORED;
CREATE INDEX IF NOT EXISTS services_search_idx ON services USING GIN (search_vector);

-- 7. Quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(status, ''))) STORED;
CREATE INDEX IF NOT EXISTS quotes_search_idx ON quotes USING GIN (search_vector);
