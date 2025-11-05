-- Create the storage bucket for mosque photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('mosque-photos', 'mosque-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the bucket
CREATE POLICY "Public Access for mosque photos" ON storage.objects
FOR SELECT USING (bucket_id = 'mosque-photos');

CREATE POLICY "Authenticated users can upload mosque photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'mosque-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update mosque photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'mosque-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete mosque photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'mosque-photos' 
  AND auth.role() = 'authenticated'
);