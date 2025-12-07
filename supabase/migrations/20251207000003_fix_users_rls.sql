-- Allow users to insert their own profile
-- This is necessary for the "self-healing" logic in the API to work
-- and generally allows users to establish their presence in the public schema

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
