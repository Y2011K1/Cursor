-- Storage RLS: allow teachers to upload profile pictures to teacher-avatars bucket.
-- Create the bucket in Dashboard first (Storage → New bucket → name: teacher-avatars, Public: on).
-- Then run this migration so uploads are allowed.

-- Teachers can upload only to their own folder (path starts with their user id)
DROP POLICY IF EXISTS "Teachers can upload profile picture" ON storage.objects;
CREATE POLICY "Teachers can upload profile picture"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'teacher-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher'
  );

-- Anyone can read (so landing page and profile pages can show images)
DROP POLICY IF EXISTS "Anyone can view teacher avatars" ON storage.objects;
CREATE POLICY "Anyone can view teacher avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'teacher-avatars');

-- Ensure teacher_profiles UPDATE allows saving (explicit WITH CHECK for updated row)
DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;
CREATE POLICY "Teachers can update own profile"
  ON teacher_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
