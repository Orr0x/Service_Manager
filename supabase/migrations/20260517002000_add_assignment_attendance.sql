-- Store actual attendance evidence per worker assignment.

ALTER TABLE job_assignments
  ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS start_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS start_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS start_location_accuracy_meters DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS start_distance_meters DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_location_accuracy_meters DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_distance_meters DOUBLE PRECISION;

UPDATE job_assignments ja
SET
  actual_start_time = COALESCE(ja.actual_start_time, j.actual_start_time),
  actual_end_time = COALESCE(ja.actual_end_time, j.actual_end_time),
  payable_start_time = COALESCE(ja.payable_start_time, j.payable_start_time),
  payable_end_time = COALESCE(ja.payable_end_time, j.payable_end_time),
  payable_minutes = COALESCE(ja.payable_minutes, j.payable_minutes),
  start_latitude = COALESCE(ja.start_latitude, j.start_latitude),
  start_longitude = COALESCE(ja.start_longitude, j.start_longitude),
  start_location_accuracy_meters = COALESCE(ja.start_location_accuracy_meters, j.start_location_accuracy_meters),
  start_distance_meters = COALESCE(ja.start_distance_meters, j.start_distance_meters),
  end_latitude = COALESCE(ja.end_latitude, j.end_latitude),
  end_longitude = COALESCE(ja.end_longitude, j.end_longitude),
  end_location_accuracy_meters = COALESCE(ja.end_location_accuracy_meters, j.end_location_accuracy_meters),
  end_distance_meters = COALESCE(ja.end_distance_meters, j.end_distance_meters)
FROM jobs j
WHERE ja.job_id = j.id
  AND (
    j.actual_start_time IS NOT NULL
    OR j.actual_end_time IS NOT NULL
    OR j.payable_minutes IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_job_assignments_actual_start_time
  ON job_assignments(actual_start_time);

CREATE INDEX IF NOT EXISTS idx_job_assignments_actual_end_time
  ON job_assignments(actual_end_time);
