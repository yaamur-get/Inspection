-- Create mosques table
CREATE TABLE IF NOT EXISTS mosques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  supervisor_name TEXT NOT NULL,
  supervisor_phone TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  location_link TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  main_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create main_items table (e.g., Restrooms, Electricity, Carpets)
CREATE TABLE IF NOT EXISTS main_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sub_items table (items under each main category)
CREATE TABLE IF NOT EXISTS sub_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_item_id UUID NOT NULL REFERENCES main_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_ar TEXT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'approved')),
  report_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report_issues table (issues found in each report)
CREATE TABLE IF NOT EXISTS report_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  main_item_id UUID NOT NULL REFERENCES main_items(id) ON DELETE RESTRICT,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('single', 'multiple')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issue_items table (link sub_items to issues with quantities)
CREATE TABLE IF NOT EXISTS issue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES report_issues(id) ON DELETE CASCADE,
  sub_item_id UUID NOT NULL REFERENCES sub_items(id) ON DELETE RESTRICT,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issue_photos table (photos for each issue)
CREATE TABLE IF NOT EXISTS issue_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES report_issues(id) ON DELETE CASCADE,
  issue_item_id UUID REFERENCES issue_items(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_photos ENABLE ROW LEVEL SECURITY;

-- Mosques policies
CREATE POLICY "Anyone can view mosques" ON mosques FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert mosques" ON mosques FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own mosques" ON mosques FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete their own mosques" ON mosques FOR DELETE USING (created_by = auth.uid());

-- Main items policies (admin only for insert/update/delete)
CREATE POLICY "Anyone can view main items" ON main_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage main items" ON main_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update main items" ON main_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete main items" ON main_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Sub items policies
CREATE POLICY "Anyone can view sub items" ON sub_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage sub items" ON sub_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update sub items" ON sub_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete sub items" ON sub_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Reports policies
CREATE POLICY "Anyone can view reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Technicians can update their own reports" ON reports FOR UPDATE USING (technician_id = auth.uid());
CREATE POLICY "Technicians can delete their own reports" ON reports FOR DELETE USING (technician_id = auth.uid());

-- Report issues policies
CREATE POLICY "Anyone can view report issues" ON report_issues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issues" ON report_issues FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update issues in their reports" ON report_issues FOR UPDATE USING (
  EXISTS (SELECT 1 FROM reports WHERE reports.id = report_issues.report_id AND reports.technician_id = auth.uid())
);
CREATE POLICY "Users can delete issues in their reports" ON report_issues FOR DELETE USING (
  EXISTS (SELECT 1 FROM reports WHERE reports.id = report_issues.report_id AND reports.technician_id = auth.uid())
);

-- Issue items policies
CREATE POLICY "Anyone can view issue items" ON issue_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issue items" ON issue_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update issue items" ON issue_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM report_issues 
    JOIN reports ON reports.id = report_issues.report_id 
    WHERE report_issues.id = issue_items.issue_id AND reports.technician_id = auth.uid()
  )
);
CREATE POLICY "Users can delete issue items" ON issue_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM report_issues 
    JOIN reports ON reports.id = report_issues.report_id 
    WHERE report_issues.id = issue_items.issue_id AND reports.technician_id = auth.uid()
  )
);

-- Issue photos policies
CREATE POLICY "Anyone can view issue photos" ON issue_photos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload photos" ON issue_photos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update photos in their reports" ON issue_photos FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM report_issues 
    JOIN reports ON reports.id = report_issues.report_id 
    WHERE report_issues.id = issue_photos.issue_id AND reports.technician_id = auth.uid()
  )
);
CREATE POLICY "Users can delete photos in their reports" ON issue_photos FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM report_issues 
    JOIN reports ON reports.id = report_issues.report_id 
    WHERE report_issues.id = issue_photos.issue_id AND reports.technician_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_mosques_created_by ON mosques(created_by);
CREATE INDEX idx_sub_items_main_item ON sub_items(main_item_id);
CREATE INDEX idx_reports_mosque ON reports(mosque_id);
CREATE INDEX idx_reports_technician ON reports(technician_id);
CREATE INDEX idx_report_issues_report ON report_issues(report_id);
CREATE INDEX idx_issue_items_issue ON issue_items(issue_id);
CREATE INDEX idx_issue_photos_issue ON issue_photos(issue_id);

-- Insert some sample main items
INSERT INTO main_items (name, name_ar) VALUES
  ('Restrooms', 'دورات المياه'),
  ('Electricity', 'الكهرباء'),
  ('Carpets', 'السجاد'),
  ('Air Conditioning', 'التكييف'),
  ('Sound System', 'نظام الصوت'),
  ('Lighting', 'الإضاءة'),
  ('Plumbing', 'السباكة'),
  ('Doors & Windows', 'الأبواب والنوافذ')
ON CONFLICT DO NOTHING;