-- بنود فرعية متضمّنة داخل بند فرعي واحد (تُعرض في نفس صف الجدول بدون تسعير مستقل)
CREATE TABLE IF NOT EXISTS issue_item_inclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_item_id UUID NOT NULL REFERENCES issue_items(id) ON DELETE CASCADE,
  sub_item_id UUID NOT NULL REFERENCES sub_items(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (issue_item_id, sub_item_id)
);

CREATE INDEX IF NOT EXISTS issue_item_inclusions_issue_item_id_idx
  ON issue_item_inclusions(issue_item_id);

ALTER TABLE issue_item_inclusions ENABLE ROW LEVEL SECURITY;

-- الحذف يحدث دائماً بالتتابع (cascade) عند حذف البند الفرعي من المشكلة،
-- لذلك نكتفي بشرط المستخدم المسجّل بدل سلسلة الملكية لتفادي فشل صامت عند تعديل الأدمن لتقرير فني آخر.
DROP POLICY IF EXISTS "Anyone can view issue item inclusions" ON issue_item_inclusions;
CREATE POLICY "Anyone can view issue item inclusions" ON issue_item_inclusions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create issue item inclusions" ON issue_item_inclusions;
CREATE POLICY "Authenticated users can create issue item inclusions" ON issue_item_inclusions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update issue item inclusions" ON issue_item_inclusions;
CREATE POLICY "Authenticated users can update issue item inclusions" ON issue_item_inclusions FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete issue item inclusions" ON issue_item_inclusions;
CREATE POLICY "Authenticated users can delete issue item inclusions" ON issue_item_inclusions FOR DELETE USING (auth.uid() IS NOT NULL);
