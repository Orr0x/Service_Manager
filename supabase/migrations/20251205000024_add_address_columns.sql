-- Add address columns to invoices
ALTER TABLE invoices 
ADD COLUMN business_address TEXT,
ADD COLUMN customer_address TEXT;

-- Add address columns to quotes
ALTER TABLE quotes 
ADD COLUMN business_address TEXT,
ADD COLUMN customer_address TEXT;

-- Add business_address to tenant_settings
ALTER TABLE tenant_settings 
ADD COLUMN business_address TEXT;
