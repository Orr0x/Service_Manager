-- Fix Search Vectors V4: Trigger-based (to include related fields)

-- 1. QUOTES: Include Customer Name
ALTER TABLE quotes DROP COLUMN IF EXISTS search_vector;
ALTER TABLE quotes ADD COLUMN search_vector tsvector;
CREATE INDEX IF NOT EXISTS quotes_search_idx ON quotes USING GIN (search_vector);

CREATE OR REPLACE FUNCTION quotes_search_vector_update() RETURNS trigger AS $$
DECLARE
  customer_record record;
  job_site_record record;
BEGIN
  SELECT * FROM customers WHERE id = NEW.customer_id INTO customer_record;
  SELECT * FROM job_sites WHERE id = NEW.job_site_id INTO job_site_record;
  
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.quote_number::text, '') || ' ' ||
    coalesce(NEW.status, '') || ' ' ||
    coalesce(customer_record.business_name, '') || ' ' ||
    coalesce(customer_record.contact_name, '') || ' ' ||
    coalesce(job_site_record.name, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quotes_search_vector_trigger ON quotes;
CREATE TRIGGER quotes_search_vector_trigger
BEFORE INSERT OR UPDATE ON quotes
FOR EACH ROW EXECUTE FUNCTION quotes_search_vector_update();

-- Update existing rows
UPDATE quotes SET id = id;


-- 2. JOBS: Include Job Site Name & Address
ALTER TABLE jobs DROP COLUMN IF EXISTS search_vector;
ALTER TABLE jobs ADD COLUMN search_vector tsvector;
CREATE INDEX IF NOT EXISTS jobs_search_idx ON jobs USING GIN (search_vector);

CREATE OR REPLACE FUNCTION jobs_search_vector_update() RETURNS trigger AS $$
DECLARE
  site_record record;
  customer_record record;
BEGIN
  SELECT * FROM job_sites WHERE id = NEW.job_site_id INTO site_record;
  SELECT * FROM customers WHERE id = NEW.customer_id INTO customer_record;

  NEW.search_vector := to_tsvector('english', 
    coalesce(NEW.title, '') || ' ' || 
    coalesce(NEW.description, '') || ' ' || 
    coalesce(NEW.status, '') || ' ' ||
    coalesce(site_record.name, '') || ' ' ||
    coalesce(site_record.address, '') || ' ' ||
    coalesce(customer_record.business_name, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_search_vector_trigger ON jobs;
CREATE TRIGGER jobs_search_vector_trigger
BEFORE INSERT OR UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION jobs_search_vector_update();

UPDATE jobs SET id = id;


-- 3. CONTRACTS: Include Customer Name
ALTER TABLE contracts DROP COLUMN IF EXISTS search_vector;
ALTER TABLE contracts ADD COLUMN search_vector tsvector;
CREATE INDEX IF NOT EXISTS contracts_search_idx ON contracts USING GIN (search_vector);

CREATE OR REPLACE FUNCTION contracts_search_vector_update() RETURNS trigger AS $$
DECLARE
  customer_record record;
BEGIN
  SELECT * FROM customers WHERE id = NEW.customer_id INTO customer_record;

  NEW.search_vector := to_tsvector('english', 
    coalesce(NEW.name, '') || ' ' || 
    coalesce(NEW.status, '') || ' ' ||
    coalesce(customer_record.business_name, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contracts_search_vector_trigger ON contracts;
CREATE TRIGGER contracts_search_vector_trigger
BEFORE INSERT OR UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION contracts_search_vector_update();

UPDATE contracts SET id = id;
