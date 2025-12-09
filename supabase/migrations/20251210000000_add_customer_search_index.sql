-- Add search_vector column to customers table
-- It generates a tsvector from business_name, contact_name, and email
ALTER TABLE customers
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(business_name, '') || ' ' || coalesce(contact_name, '') || ' ' || coalesce(email, ''))
) STORED;

-- Add GIN index for fast full text search
CREATE INDEX customers_search_idx ON customers USING GIN (search_vector);
