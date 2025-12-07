-- Drop existing check constraint and add 'customer' role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('provider', 'admin', 'staff', 'customer'));
