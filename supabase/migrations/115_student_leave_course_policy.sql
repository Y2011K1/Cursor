-- Allow students to update their own enrollment (e.g. set is_active = false to leave a course)
DROP POLICY IF EXISTS "Students can update own enrollment" ON enrollments;
CREATE POLICY "Students can update own enrollment"
  ON enrollments FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
