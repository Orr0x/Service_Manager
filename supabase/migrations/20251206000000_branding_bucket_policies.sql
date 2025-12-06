-- Enable RLS on objects is usually already done by Supabase
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public access to view files in the branding bucket
CREATE POLICY "Public Access Branding"
ON storage.objects FOR SELECT
USING ( bucket_id = 'branding' );

-- Allow authenticated users to upload files to the branding bucket
CREATE POLICY "Authenticated Upload Branding"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'branding' );

-- Allow authenticated users to update their own files (or all files if shared)
-- For branding, we'll allow authenticated users to update any file in the bucket
CREATE POLICY "Authenticated Update Branding"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'branding' );

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated Delete Branding"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'branding' );
