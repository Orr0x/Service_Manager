-- Add user_id to contractors table to link them to system users
ALTER TABLE contractors 
ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_contractors_user_id ON contractors(user_id);
