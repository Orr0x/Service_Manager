-- Add engagement_type to customers table
ALTER TABLE customers ADD COLUMN engagement_type TEXT CHECK (engagement_type IN ('contract', 'pay_as_you_go')) DEFAULT 'pay_as_you_go';
