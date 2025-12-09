-- Add search_vector to checklists
ALTER TABLE checklists
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
) STORED;
CREATE INDEX checklists_search_idx ON checklists USING GIN (search_vector);

-- Add search_vector to jobs
ALTER TABLE jobs
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
) STORED;
CREATE INDEX jobs_search_idx ON jobs USING GIN (search_vector);

-- Add search_vector to job_sites
ALTER TABLE job_sites
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(address, '') || ' ' || coalesce(city, ''))
) STORED;
CREATE INDEX job_sites_search_idx ON job_sites USING GIN (search_vector);

-- Add search_vector to contracts
ALTER TABLE contracts
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(type, '') || ' ' || coalesce(status, ''))
) STORED;
CREATE INDEX contracts_search_idx ON contracts USING GIN (search_vector);

-- Add search_vector to workers
ALTER TABLE workers
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(role, ''))
) STORED;
CREATE INDEX workers_search_idx ON workers USING GIN (search_vector);

-- Add search_vector to services
ALTER TABLE services
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, ''))
) STORED;
CREATE INDEX services_search_idx ON services USING GIN (search_vector);

-- Add search_vector to quotes
ALTER TABLE quotes
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(status, ''))
) STORED;
CREATE INDEX quotes_search_idx ON quotes USING GIN (search_vector);
