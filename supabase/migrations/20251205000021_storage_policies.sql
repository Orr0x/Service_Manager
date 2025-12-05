-- Ensure the 'attachments' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files to 'attachments' bucket
CREATE POLICY "Authenticated users can upload attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');

-- Policy: Allow authenticated users to update their own files in 'attachments' bucket
CREATE POLICY "Authenticated users can update attachments" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'attachments');

-- Policy: Allow authenticated users to delete their own files in 'attachments' bucket
CREATE POLICY "Authenticated users can delete attachments" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'attachments');

-- Policy: Allow public access to view files in 'attachments' bucket
CREATE POLICY "Public can view attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments');
