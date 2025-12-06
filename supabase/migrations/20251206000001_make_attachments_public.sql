-- Make the attachments bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'attachments';

-- Ensure RLS policies are correct (just in case)
-- Allow public access to view files in attachments bucket
DROP POLICY IF EXISTS "Public can view attachments" ON storage.objects;
CREATE POLICY "Public can view attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments');
