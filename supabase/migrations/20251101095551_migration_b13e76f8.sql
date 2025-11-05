-- First, drop ALL existing storage policies for mosque-photos bucket
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their photos" ON storage.objects;

-- Create comprehensive storage policies that explicitly allow all operations
-- INSERT policy: Allow ANY authenticated user to upload to mosque-photos bucket
CREATE POLICY "Enable insert for authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mosque-photos');

-- SELECT policy: Allow public read access (anyone can view photos)
CREATE POLICY "Enable select for all users"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mosque-photos');

-- UPDATE policy: Allow authenticated users to update files
CREATE POLICY "Enable update for authenticated users"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'mosque-photos')
WITH CHECK (bucket_id = 'mosque-photos');

-- DELETE policy: Allow authenticated users to delete files
CREATE POLICY "Enable delete for authenticated users"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mosque-photos');