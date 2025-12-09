-- Change user_id FK to reference public.users instead of auth.users
-- This allows PostgREST to detect the relationship for joins

ALTER TABLE "public"."customers" 
DROP CONSTRAINT "customers_user_id_fkey";

ALTER TABLE "public"."customers"
ADD CONSTRAINT "customers_user_id_fkey" 
FOREIGN KEY ("user_id") 
REFERENCES "public"."users"("id") 
ON DELETE SET NULL;
