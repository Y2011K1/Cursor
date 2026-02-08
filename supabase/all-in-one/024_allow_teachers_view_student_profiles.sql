-- ============================================
-- Allow Teachers to View Student Profiles
-- Teachers need to view student profiles for students enrolled in their classroom
-- ============================================

-- Allow teachers to view student profiles for students enrolled in their classroom
CREATE POLICY "Teachers can view classroom student profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_teacher() AND
    role = 'student' AND
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.student_id = profiles.id
      AND e.classroom_id = public.get_teacher_classroom_id()
      AND e.is_active = true
    )
  );
