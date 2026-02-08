-- ============================================
-- FIX EXAM AND QUIZ SUBMISSIONS RLS POLICIES
-- Adds missing UPDATE policies for exam_submissions and quiz_submissions
-- Adds missing policies for exam_answers and quiz_answers (dropped in migration 011, not recreated)
-- ============================================

-- ============================================
-- EXAM_SUBMISSIONS UPDATE POLICY
-- ============================================

-- Students can update their own exam submissions (to mark as completed)
CREATE POLICY "Students can update own exam submissions"
  ON public.exam_submissions FOR UPDATE
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND
      public.is_student_enrolled_in_classroom(e.classroom_id)
    )
  )
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND
      public.is_student_enrolled_in_classroom(e.classroom_id)
    )
  );

-- ============================================
-- EXAM_ANSWERS POLICIES (Recreate after course removal)
-- ============================================

-- Drop any existing exam_answers policies that might reference courses
DROP POLICY IF EXISTS "Students can manage own exam answers" ON public.exam_answers;
DROP POLICY IF EXISTS "Teachers can view classroom exam answers" ON public.exam_answers;
DROP POLICY IF EXISTS "Admins can view all exam answers" ON public.exam_answers;

-- Students can insert exam answers for their own submissions
CREATE POLICY "Students can insert own exam answers"
  ON public.exam_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_submissions es
      WHERE es.id = exam_answers.submission_id AND 
      es.student_id = auth.uid() AND
      NOT es.is_completed AND
      EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = es.exam_id AND
        public.is_student_enrolled_in_classroom(e.classroom_id)
      )
    )
  );

-- Students can update exam answers for their own submissions (before completion)
CREATE POLICY "Students can update own exam answers"
  ON public.exam_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions es
      WHERE es.id = exam_answers.submission_id AND 
      es.student_id = auth.uid() AND
      NOT es.is_completed AND
      EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = es.exam_id AND
        public.is_student_enrolled_in_classroom(e.classroom_id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_submissions es
      WHERE es.id = exam_answers.submission_id AND 
      es.student_id = auth.uid() AND
      NOT es.is_completed AND
      EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = es.exam_id AND
        public.is_student_enrolled_in_classroom(e.classroom_id)
      )
    )
  );

-- Students can view their own exam answers
CREATE POLICY "Students can view own exam answers"
  ON public.exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions es
      WHERE es.id = exam_answers.submission_id AND 
      es.student_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = es.exam_id AND
        public.is_student_enrolled_in_classroom(e.classroom_id)
      )
    )
  );

-- Teachers can view exam answers in their classroom
CREATE POLICY "Teachers can view classroom exam answers"
  ON public.exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions es
      JOIN public.exams e ON es.exam_id = e.id
      JOIN public.classrooms cl ON e.classroom_id = cl.id
      WHERE es.id = exam_answers.submission_id AND 
      cl.teacher_id = auth.uid()
    )
  );

-- Admins can view all exam answers
CREATE POLICY "Admins can view all exam answers"
  ON public.exam_answers FOR SELECT
  USING (public.is_admin());

-- ============================================
-- QUIZ_SUBMISSIONS UPDATE POLICY
-- ============================================

-- Students can update their own quiz submissions (to mark as completed)
CREATE POLICY "Students can update own quiz submissions"
  ON public.quiz_submissions FOR UPDATE
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_submissions.quiz_id AND
      public.is_student_enrolled_in_classroom(q.classroom_id)
    )
  )
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_submissions.quiz_id AND
      public.is_student_enrolled_in_classroom(q.classroom_id)
    )
  );

-- ============================================
-- QUIZ_ANSWERS POLICIES (Recreate after course removal)
-- ============================================

-- Drop any existing quiz_answers policies that might reference courses
DROP POLICY IF EXISTS "Students can manage own quiz answers" ON public.quiz_answers;
DROP POLICY IF EXISTS "Teachers can view classroom quiz answers" ON public.quiz_answers;
DROP POLICY IF EXISTS "Admins can view all quiz answers" ON public.quiz_answers;

-- Students can insert quiz answers for their own submissions
CREATE POLICY "Students can insert own quiz answers"
  ON public.quiz_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_submissions qs
      WHERE qs.id = quiz_answers.submission_id AND 
      qs.student_id = auth.uid() AND
      NOT qs.is_completed AND
      EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = qs.quiz_id AND
        public.is_student_enrolled_in_classroom(q.classroom_id)
      )
    )
  );

-- Students can update quiz answers for their own submissions (before completion)
CREATE POLICY "Students can update own quiz answers"
  ON public.quiz_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_submissions qs
      WHERE qs.id = quiz_answers.submission_id AND 
      qs.student_id = auth.uid() AND
      NOT qs.is_completed AND
      EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = qs.quiz_id AND
        public.is_student_enrolled_in_classroom(q.classroom_id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_submissions qs
      WHERE qs.id = quiz_answers.submission_id AND 
      qs.student_id = auth.uid() AND
      NOT qs.is_completed AND
      EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = qs.quiz_id AND
        public.is_student_enrolled_in_classroom(q.classroom_id)
      )
    )
  );

-- Students can view their own quiz answers
CREATE POLICY "Students can view own quiz answers"
  ON public.quiz_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_submissions qs
      WHERE qs.id = quiz_answers.submission_id AND 
      qs.student_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = qs.quiz_id AND
        public.is_student_enrolled_in_classroom(q.classroom_id)
      )
    )
  );

-- Teachers can view quiz answers in their classroom
CREATE POLICY "Teachers can view classroom quiz answers"
  ON public.quiz_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_submissions qs
      JOIN public.quizzes q ON qs.quiz_id = q.id
      JOIN public.classrooms cl ON q.classroom_id = cl.id
      WHERE qs.id = quiz_answers.submission_id AND 
      cl.teacher_id = auth.uid()
    )
  );

-- Admins can view all quiz answers
CREATE POLICY "Admins can view all quiz answers"
  ON public.quiz_answers FOR SELECT
  USING (public.is_admin());
