-- Make created_by nullable and remove NOT NULL constraint if exists
ALTER TABLE mosques ALTER COLUMN created_by DROP NOT NULL;

-- Update the RLS policy to allow inserts without created_by
DROP POLICY IF EXISTS "Allow mosque inserts with created_by" ON mosques;

CREATE POLICY "Allow mosque inserts for development" ON mosques
  FOR INSERT
  WITH CHECK (true);

-- Also update the UPDATE and DELETE policies to be more permissive for development
DROP POLICY IF EXISTS "Users can update their own mosques" ON mosques;
DROP POLICY IF EXISTS "Users can delete their own mosques" ON mosques;

CREATE POLICY "Allow mosque updates for development" ON mosques
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow mosque deletes for development" ON mosques
  FOR DELETE
  USING (true);