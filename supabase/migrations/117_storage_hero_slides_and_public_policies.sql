-- Storage RLS: hero-slides (admins) and public bucket (blog/course images).
-- Create buckets in Dashboard first: hero-slides (public), public (public), and optionally uploads (public).

-- hero-slides: admins can upload, anyone can read
DROP POLICY IF EXISTS "Admins can upload hero slides" ON storage.objects;
CREATE POLICY "Admins can upload hero slides"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'hero-slides'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Anyone can view hero slides" ON storage.objects;
CREATE POLICY "Anyone can view hero slides"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'hero-slides');

-- public bucket: admins (blog) and teachers (course images) can upload, anyone can read
DROP POLICY IF EXISTS "Admins and teachers can upload to public bucket" ON storage.objects;
CREATE POLICY "Admins and teachers can upload to public bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'public'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
  );

DROP POLICY IF EXISTS "Anyone can view public bucket" ON storage.objects;
CREATE POLICY "Anyone can view public bucket"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'public');

-- uploads bucket (fallback for blog/course): same as public
DROP POLICY IF EXISTS "Admins and teachers can upload to uploads bucket" ON storage.objects;
CREATE POLICY "Admins and teachers can upload to uploads bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
  );

DROP POLICY IF EXISTS "Anyone can view uploads bucket" ON storage.objects;
CREATE POLICY "Anyone can view uploads bucket"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'uploads');
