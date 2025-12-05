-- Fix job_assignments to reference workers instead of users
ALTER TABLE job_assignments DROP CONSTRAINT job_assignments_assignee_check;

ALTER TABLE job_assignments
  DROP COLUMN user_id,
  ADD COLUMN worker_id UUID REFERENCES workers(id) ON DELETE CASCADE;

ALTER TABLE job_assignments
  ADD CONSTRAINT job_assignments_assignee_check CHECK (
    (worker_id IS NOT NULL AND contractor_id IS NULL) OR
    (worker_id IS NULL AND contractor_id IS NOT NULL)
  );
