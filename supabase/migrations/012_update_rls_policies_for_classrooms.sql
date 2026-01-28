-- ============================================
-- Update RLS Policies to Use Classrooms Instead of Courses
-- ============================================
-- This migration updates all RLS policies that reference courses
-- to use classroom_id directly
-- This migration is idempotent and can be safely re-run
-- ============================================

-- Drop old course-related policies (if courses table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'courses'
  ) THEN
    DROP POLICY IF EXISTS "Teachers can manage own classroom courses" ON public.courses;
    DROP POLICY IF EXISTS "Students can view published courses" ON public.courses;
    DROP POLICY IF EXISTS "Admins can view all courses" ON public.courses;
  END IF;
END $$;

-- ============================================
-- LESSONS POLICIES (Updated)
-- ============================================

-- Drop old lessons policies
DROP POLICY IF EXISTS "Teachers can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Students can view published lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can view all lessons" ON public.lessons;

-- Teachers can manage lessons in their classroom
CREATE POLICY "Teachers can manage lessons"
  ON public.lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms cl
      WHERE cl.id = lessons.classroom_id AND cl.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classrooms cl
      WHERE cl.id = lessons.classroom_id AND cl.teacher_id = auth.uid()
    )
  );

-- Students can view published lessons in their enrolled classrooms
CREATE POLICY "Students can view published lessons"
  ON public.lessons FOR SELECT
  USING (
    is_published = true AND
    public.is_student_enrolled_in_classroom(classroom_id)
  );

-- Admins can view all lessons
CREATE POLICY "Admins can view all lessons"
  ON public.lessons FOR SELECT
  USING (public.is_admin());

-- ============================================
-- QUIZZES POLICIES (Updated)
-- ============================================

-- Drop old quizzes policies
DROP POLICY IF EXISTS "Teachers can manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Students can view published quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Admins can view all quizzes" ON public.quizzes;

-- Teachers can manage quizzes in their classroom
CREATE POLICY "Teachers can manage quizzes"
  ON public.quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms cl
      WHERE cl.id = quizzes.classroom_id AND cl.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classrooms cl
      WHERE cl.id = quizzes.classroom_id AND cl.teacher_id = auth.uid()
    )
  );

-- Students can view published quizzes in their enrolled classrooms
CREATE POLICY "Students can view published quizzes"
  ON public.quizzes FOR SELECT
  USING (
    is_published = true AND
    public.is_student_enrolled_in_classroom(classroom_id)
  );

-- Admins can view all quizzes
CREATE POLICY "Admins can view all quizzes"
  ON public.quizzes FOR SELECT
  USING (public.is_admin());

-- ============================================
-- EXAMS POLICIES (Updated)
-- ============================================

-- Drop old exams policies
DROP POLICY IF EXISTS "Teachers can manage exams" ON public.exams;
DROP POLICY IF EXISTS "Students can view published exams" ON public.exams;
DROP POLICY IF EXISTS "Admins can view all exams" ON public.exams;

-- Teachers can manage exams in their classroom
CREATE POLICY "Teachers can manage exams"
  ON public.exams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms cl
      WHERE cl.id = exams.classroom_id AND cl.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classrooms cl
      WHERE cl.id = exams.classroom_id AND cl.teacher_id = auth.uid()
    )
  );

-- Students can view published exams in their enrolled classrooms
CREATE POLICY "Students can view published exams"
  ON public.exams FOR SELECT
  USING (
    is_published = true AND
    public.is_student_enrolled_in_classroom(classroom_id)
  );

-- Admins can view all exams
CREATE POLICY "Admins can view all exams"
  ON public.exams FOR SELECT
  USING (public.is_admin());

-- ============================================
-- QUIZ_QUESTIONS POLICIES (Updated)
-- ============================================

-- Drop old quiz_questions policies
DROP POLICY IF EXISTS "Teachers can manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Students can view quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admins can view all quiz questions" ON public.quiz_questions;

-- Teachers can manage quiz questions in their classroom
CREATE POLICY "Teachers can manage quiz questions"
  ON public.quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.classrooms cl ON q.classroom_id = cl.id
      WHERE q.id = quiz_questions.quiz_id AND cl.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.classrooms cl ON q.classroom_id = cl.id
      WHERE q.id = quiz_questions.quiz_id AND cl.teacher_id = auth.uid()
    )
  );

-- Students can view quiz questions for published quizzes in their enrolled classrooms
CREATE POLICY "Students can view quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_questions.quiz_id AND
      q.is_published = true AND
      public.is_student_enrolled_in_classroom(q.classroom_id)
    )
  );

-- Admins can view all quiz questions
CREATE POLICY "Admins can view all quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (public.is_admin());

-- ============================================
-- EXAM_QUESTIONS POLICIES (Updated)
-- ============================================

-- Drop old exam_questions policies
DROP POLICY IF EXISTS "Teachers can manage exam questions" ON public.exam_questions;
DROP POLICY IF EXISTS "Students can view exam questions" ON public.exam_questions;
DROP POLICY IF EXISTS "Admins can view all exam questions" ON public.exam_questions;

-- Teachers can manage exam questions in their classroom
CREATE POLICY "Teachers can manage exam questions"
  ON public.exam_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.classrooms cl ON e.classroom_id = cl.id
      WHERE e.id = exam_questions.exam_id AND cl.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.classrooms cl ON e.classroom_id = cl.id
      WHERE e.id = exam_questions.exam_id AND cl.teacher_id = auth.uid()
    )
  );

-- Students can view exam questions for published exams in their enrolled classrooms
CREATE POLICY "Students can view exam questions"
  ON public.exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_questions.exam_id AND
      e.is_published = true AND
      public.is_student_enrolled_in_classroom(e.classroom_id)
    )
  );

-- Admins can view all exam questions
CREATE POLICY "Admins can view all exam questions"
  ON public.exam_questions FOR SELECT
  USING (public.is_admin());

-- ============================================
-- QUIZ_SUBMISSIONS POLICIES (Updated)
-- ============================================

-- Drop old quiz_submissions policies
DROP POLICY IF EXISTS "Students can submit quizzes" ON public.quiz_submissions;
DROP POLICY IF EXISTS "Students can view own quiz submissions" ON public.quiz_submissions;
DROP POLICY IF EXISTS "Teachers can view quiz submissions" ON public.quiz_submissions;
DROP POLICY IF EXISTS "Admins can view all quiz submissions" ON public.quiz_submissions;

-- Students can submit quizzes in their enrolled classrooms
CREATE POLICY "Students can submit quizzes"
  ON public.quiz_submissions FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_submissions.quiz_id AND
      public.is_student_enrolled_in_classroom(q.classroom_id)
    )
  );

-- Students can view their own quiz submissions
CREATE POLICY "Students can view own quiz submissions"
  ON public.quiz_submissions FOR SELECT
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_submissions.quiz_id AND
      public.is_student_enrolled_in_classroom(q.classroom_id)
    )
  );

-- Teachers can view quiz submissions in their classroom
CREATE POLICY "Teachers can view quiz submissions"
  ON public.quiz_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.classrooms cl ON q.classroom_id = cl.id
      WHERE q.id = quiz_submissions.quiz_id AND cl.teacher_id = auth.uid()
    )
  );

-- Admins can view all quiz submissions
CREATE POLICY "Admins can view all quiz submissions"
  ON public.quiz_submissions FOR SELECT
  USING (public.is_admin());

-- ============================================
-- EXAM_SUBMISSIONS POLICIES (Updated)
-- ============================================

-- Drop old exam_submissions policies
DROP POLICY IF EXISTS "Students can submit exams" ON public.exam_submissions;
DROP POLICY IF EXISTS "Students can view own exam submissions" ON public.exam_submissions;
DROP POLICY IF EXISTS "Teachers can view exam submissions" ON public.exam_submissions;
DROP POLICY IF EXISTS "Admins can view all exam submissions" ON public.exam_submissions;

-- Students can submit exams in their enrolled classrooms
CREATE POLICY "Students can submit exams"
  ON public.exam_submissions FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND
      public.is_student_enrolled_in_classroom(e.classroom_id)
    )
  );

-- Students can view their own exam submissions
CREATE POLICY "Students can view own exam submissions"
  ON public.exam_submissions FOR SELECT
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND
      public.is_student_enrolled_in_classroom(e.classroom_id)
    )
  );

-- Teachers can view exam submissions in their classroom
CREATE POLICY "Teachers can view exam submissions"
  ON public.exam_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.classrooms cl ON e.classroom_id = cl.id
      WHERE e.id = exam_submissions.exam_id AND cl.teacher_id = auth.uid()
    )
  );

-- Admins can view all exam submissions
CREATE POLICY "Admins can view all exam submissions"
  ON public.exam_submissions FOR SELECT
  USING (public.is_admin());

-- ============================================
-- LESSON_PROGRESS POLICIES (Updated)
-- ============================================

-- Drop old lesson_progress policies
DROP POLICY IF EXISTS "Students can manage own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Teachers can view lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Admins can view all lesson progress" ON public.lesson_progress;

-- Students can manage their own lesson progress
CREATE POLICY "Students can manage own lesson progress"
  ON public.lesson_progress FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_progress.lesson_id AND
      public.is_student_enrolled_in_classroom(l.classroom_id)
    )
  );

-- Teachers can view lesson progress in their classroom
CREATE POLICY "Teachers can view lesson progress"
  ON public.lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.classrooms cl ON l.classroom_id = cl.id
      WHERE l.id = lesson_progress.lesson_id AND cl.teacher_id = auth.uid()
    )
  );

-- Admins can view all lesson progress
CREATE POLICY "Admins can view all lesson progress"
  ON public.lesson_progress FOR SELECT
  USING (public.is_admin());
