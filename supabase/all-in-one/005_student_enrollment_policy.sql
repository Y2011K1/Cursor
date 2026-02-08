-- ============================================
-- Allow students to enroll themselves
-- ============================================

-- Students can insert their own enrollments
CREATE POLICY "Students can enroll themselves"
  ON public.enrollments FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    public.is_student()
  );
