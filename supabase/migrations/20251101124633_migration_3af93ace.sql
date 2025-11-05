-- Drop the existing INSERT policy for mosques
DROP POLICY IF EXISTS "Authenticated users can insert mosques" ON mosques;

-- Create a new, more permissive INSERT policy that allows inserts
-- This policy allows any insert as long as created_by is provided
CREATE POLICY "Allow mosque inserts with created_by" ON mosques
  FOR INSERT
  WITH CHECK (created_by IS NOT NULL);