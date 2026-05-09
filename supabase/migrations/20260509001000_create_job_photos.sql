-- Create dedicated job photo evidence records and temporary staging bucket.

CREATE TABLE IF NOT EXISTS job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'during', 'after')),
  description TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_bucket TEXT NOT NULL DEFAULT 'job-photos',
  storage_path TEXT,
  google_drive_file_id TEXT,
  google_drive_web_view_link TEXT,
  google_drive_folder_id TEXT,
  status TEXT NOT NULL DEFAULT 'stored_in_supabase' CHECK (
    status IN (
      'stored_in_supabase',
      'syncing_to_google_drive',
      'stored_in_google_drive',
      'google_drive_failed'
    )
  ),
  last_error TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_photos_job_created
  ON job_photos(job_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_photos_status
  ON job_photos(status);

DROP TRIGGER IF EXISTS handle_job_photos_updated_at ON job_photos;
CREATE TRIGGER handle_job_photos_updated_at
  BEFORE UPDATE ON job_photos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_photos'
      AND policyname = 'Authenticated users can select job photos'
  ) THEN
    CREATE POLICY "Authenticated users can select job photos" ON job_photos
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_photos'
      AND policyname = 'Authenticated users can insert job photos'
  ) THEN
    CREATE POLICY "Authenticated users can insert job photos" ON job_photos
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_photos'
      AND policyname = 'Authenticated users can update job photos'
  ) THEN
    CREATE POLICY "Authenticated users can update job photos" ON job_photos
      FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload job photos'
  ) THEN
    CREATE POLICY "Authenticated users can upload job photos" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'job-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can view job photos'
  ) THEN
    CREATE POLICY "Authenticated users can view job photos" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'job-photos');
  END IF;
END $$;
