-- Drop ALL existing storage policies (complete reset)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable select for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow all inserts to mosque-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow all selects from mosque-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to mosque-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from mosque-photos" ON storage.objects;

-- Create brand new storage policies with clear, unique names
-- These policies are extremely permissive to ensure uploads work

-- POLICY 1: Allow anyone to insert (upload) to mosque-photos bucket
CREATE POLICY "mosque_photos_insert_policy"
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'mosque-photos');

-- POLICY 2: Allow anyone to select (view) from mosque-photos bucket
CREATE POLICY "mosque_photos_select_policy"
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'mosque-photos');

-- POLICY 3: Allow anyone to update files in mosque-photos bucket
CREATE POLICY "mosque_photos_update_policy"
ON storage.objects 
FOR UPDATE 
TO public
USING (bucket_id = 'mosque-photos')
WITH CHECK (bucket_id = 'mosque-photos');

-- POLICY 4: Allow anyone to delete from mosque-photos bucket
CREATE POLICY "mosque_photos_delete_policy"
ON storage.objects 
FOR DELETE 
TO public
USING (bucket_id = 'mosque-photos');