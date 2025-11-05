-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Public Access for mosque photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload mosque photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update mosque photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete mosque photos" ON storage.objects;

-- Create new, correct policies for storage
-- Allow public read access
CREATE POLICY "Public read access for mosque photos" ON storage.objects
FOR SELECT USING (bucket_id = 'mosque-photos');

-- Allow authenticated users to insert
CREATE POLICY "Authenticated users can insert mosque photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'mosque-photos' 
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update mosque photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'mosque-photos' 
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete mosque photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'mosque-photos' 
  AND auth.uid() IS NOT NULL
);