
-- Add columns to services table
ALTER TABLE "public"."services" 
ADD COLUMN "coverage_area" text,
ADD COLUMN "image_url" text;

-- Add comments for documentation
COMMENT ON COLUMN "public"."services"."coverage_area" IS 'Description of where the service is available';
COMMENT ON COLUMN "public"."services"."image_url" IS 'URL to the service featured image';
