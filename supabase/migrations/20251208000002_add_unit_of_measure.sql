
-- Add unit_of_measure column to services table
ALTER TABLE "public"."services" 
ADD COLUMN "unit_of_measure" text;

-- Add comment
COMMENT ON COLUMN "public"."services"."unit_of_measure" IS 'Pricing unit (e.g., per hour, per item, per job, per contract)';
