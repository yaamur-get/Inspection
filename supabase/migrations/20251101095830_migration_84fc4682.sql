-- Drop ALL existing storage policies for a complete fresh start
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable select for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow all inserts to mosque-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow all selects from mosque-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to mosque-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from mosque-photos" ON storage.objects;
DROP POLICY IF EXISTS "mosque_photos_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "mosque_photos_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "mosque_photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "mosque_photos_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "mosque_photos_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "mosque_photos_public_select" ON storage.objects;
DROP POLICY IF EXISTS "mosque_photos_public_update" ON storage.objects;
DROP POLICY IF EXISTS "mosque_photos_public_delete" ON storage.objects;

-- Create ultra-simple storage policies using Supabase's recommended pattern
-- These policies use 'true' as the condition, meaning they always allow the action

CREATE POLICY "Allow public uploads to mosque-photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'mosque-photos'
);

CREATE POLICY "Allow public reads from mosque-photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'mosque-photos'
);

CREATE POLICY "Allow public updates to mosque-photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'mosque-photos'
);

CREATE POLICY "Allow public deletes from mosque-photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'mosque-photos'
);