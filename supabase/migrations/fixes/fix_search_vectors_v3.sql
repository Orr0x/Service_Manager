-- Comprehensive Search Fix V3 (Corrected)
-- Removed non-existent 'job_number' column from jobs table
-- casting numeric 'quote_number' to text for search

-- 1. Checklists
ALTER TABLE checklists DROP COLUMN IF EXISTS search_vector;
ALTER TABLE checklists ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))) STORED;
CREATE INDEX IF NOT EXISTS checklists_search_idx ON checklists USING GIN (search_vector);

-- 2. Jobs (REMOVED job_number, added status/priority)
ALTER TABLE jobs DROP COLUMN IF EXISTS search_vector;
ALTER TABLE jobs ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(title, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(status, '') || ' ' ||
    coalesce(priority, '')
  )
) STORED;
CREATE INDEX IF NOT EXISTS jobs_search_idx ON jobs USING GIN (search_vector);

-- 3. Job Sites
ALTER TABLE job_sites DROP COLUMN IF EXISTS search_vector;
ALTER TABLE job_sites ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(name, '') || ' ' || 
    coalesce(address, '') || ' ' || 
    coalesce(city, '') || ' ' ||
    coalesce(state, '') || ' ' ||
    coalesce(postal_code, '')
  )
) STORED;
CREATE INDEX IF NOT EXISTS job_sites_search_idx ON job_sites USING GIN (search_vector);

-- 4. Contracts
ALTER TABLE contracts DROP COLUMN IF EXISTS search_vector;
ALTER TABLE contracts ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(name, '') || ' ' || 
    coalesce(type, '') || ' ' || 
    coalesce(status, '')
  )
) STORED;
CREATE INDEX IF NOT EXISTS contracts_search_idx ON contracts USING GIN (search_vector);

-- 5. Workers (Added phone, skills)
ALTER TABLE workers DROP COLUMN IF EXISTS search_vector;
ALTER TABLE workers ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(first_name, '') || ' ' || 
    coalesce(last_name, '') || ' ' || 
    coalesce(email, '') || ' ' || 
    coalesce(role, '') || ' ' ||
    coalesce(phone, '')
  )
) STORED;
CREATE INDEX IF NOT EXISTS workers_search_idx ON workers USING GIN (search_vector);

-- 6. Services (Added category)
ALTER TABLE services DROP COLUMN IF EXISTS search_vector;
ALTER TABLE services ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(name, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(category, '')
  )
) STORED;
CREATE INDEX IF NOT EXISTS services_search_idx ON services USING GIN (search_vector);

-- 7. Quotes (Includes quote_number cast to text)
ALTER TABLE quotes DROP COLUMN IF EXISTS search_vector;
ALTER TABLE quotes ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(title, '') || ' ' || 
    coalesce(status, '') || ' ' ||
    coalesce(quote_number::text, '')
  )
) STORED;
CREATE INDEX IF NOT EXISTS quotes_search_idx ON quotes USING GIN (search_vector);
