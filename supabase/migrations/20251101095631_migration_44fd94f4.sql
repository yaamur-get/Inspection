-- First, let's completely reset all storage policies for mosque-photos
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable select for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;

-- Create very permissive policies that will definitely work
-- Policy 1: Allow ALL users to INSERT into mosque-photos bucket
CREATE POLICY "Allow all inserts to mosque-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'mosque-photos');

-- Policy 2: Allow ALL users to SELECT from mosque-photos bucket  
CREATE POLICY "Allow all selects from mosque-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'mosque-photos');

-- Policy 3: Allow ALL users to UPDATE in mosque-photos bucket
CREATE POLICY "Allow all updates to mosque-photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'mosque-photos')
WITH CHECK (bucket_id = 'mosque-photos');

-- Policy 4: Allow ALL users to DELETE from mosque-photos bucket
CREATE POLICY "Allow all deletes from mosque-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'mosque-photos');