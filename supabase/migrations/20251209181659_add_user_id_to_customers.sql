-- Add user_id to customers table
ALTER TABLE "public"."customers" 
ADD COLUMN "user_id" uuid REFERENCES "auth"."users"("id");

-- Create index for performance
CREATE INDEX "customers_user_id_idx" ON "public"."customers"("user_id");
