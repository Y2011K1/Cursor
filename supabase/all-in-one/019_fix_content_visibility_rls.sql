-- ============================================
-- Fix Content Visibility RLS Policies
-- Allow students to see published content from enrolled classrooms
-- Note: We check enrollment, but don't require classroom to be active
-- so previously published content remains visible
-- ============================================

-- Update lessons policy - allow viewing published content from enrolled classrooms
DROP POLICY IF EXISTS "Students can view published lessons" ON public.lessons;
CREATE POLICY "Students can view published lessons"
  ON public.lessons FOR SELECT
  USING (
    is_published = true AND
    public.is_student_enrolled_in_classroom(classroom_id)
  );

-- Update quizzes policy - allow viewing published content from enrolled classrooms
DROP POLICY IF EXISTS "Students can view published quizzes" ON public.quizzes;
CREATE POLICY "Students can view published quizzes"
  ON public.quizzes FOR SELECT
  USING (
    is_published = true AND
    public.is_student_enrolled_in_classroom(classroom_id)
  );

-- Update exams policy - allow viewing published content from enrolled classrooms
DROP POLICY IF EXISTS "Students can view published exams" ON public.exams;
CREATE POLICY "Students can view published exams"
  ON public.exams FOR SELECT
  USING (
    is_published = true AND
    public.is_student_enrolled_in_classroom(classroom_id)
  );

-- Update course_materials policy - allow viewing published content from enrolled classrooms
DROP POLICY IF EXISTS "Students can view published course materials" ON public.course_materials;
CREATE POLICY "Students can view published course materials"
  ON public.course_materials FOR SELECT
  USING (
    is_published = true AND
    public.is_student_enrolled_in_classroom(classroom_id)
  );
