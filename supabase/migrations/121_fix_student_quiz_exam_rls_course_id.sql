-- ============================================
-- Fix student quiz/exam RLS: use course_id (column renamed in 100)
-- Policies from 012/020 reference classroom_id which no longer exists;
-- students could not take quizzes or exams.
-- ============================================

-- ---------- QUIZ_SUBMISSIONS: student SELECT, INSERT, UPDATE (course_id) ----------
DROP POLICY IF EXISTS "Students can submit quizzes" ON public.quiz_submissions;
DROP POLICY IF EXISTS "Students can view own quiz submissions" ON public.quiz_submissions;
DROP POLICY IF EXISTS "Students can update own quiz submissions" ON public.quiz_submissions;

CREATE POLICY "Students can submit quizzes"
  ON public.quiz_submissions FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_submissions.quiz_id AND
      public.is_student_enrolled_in_classroom(q.course_id)
    )
  );

CREATE POLICY "Students can view own quiz submissions"
  ON public.quiz_submissions FOR SELECT
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_submissions.quiz_id AND
      public.is_student_enrolled_in_classroom(q.course_id)
    )
  );

CREATE POLICY "Students can update own quiz submissions"
  ON public.quiz_submissions FOR UPDATE
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_submissions.quiz_id AND
      public.is_student_enrolled_in_classroom(q.course_id)
    )
  )
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_submissions.quiz_id AND
      public.is_student_enrolled_in_classroom(q.course_id)
    )
  );

-- ---------- EXAM_SUBMISSIONS: student SELECT, INSERT, UPDATE (course_id) ----------
DROP POLICY IF EXISTS "Students can update own exam submissions" ON public.exam_submissions;
DROP POLICY IF EXISTS "Students can submit exams" ON public.exam_submissions;
DROP POLICY IF EXISTS "Students can view own exam submissions" ON public.exam_submissions;

CREATE POLICY "Students can submit exams"
  ON public.exam_submissions FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND
      public.is_student_enrolled_in_classroom(e.course_id)
    )
  );

CREATE POLICY "Students can view own exam submissions"
  ON public.exam_submissions FOR SELECT
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND
      public.is_student_enrolled_in_classroom(e.course_id)
    )
  );

CREATE POLICY "Students can update own exam submissions"
  ON public.exam_submissions FOR UPDATE
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND
      public.is_student_enrolled_in_classroom(e.course_id)
    )
  )
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_submissions.exam_id AND
      public.is_student_enrolled_in_classroom(e.course_id)
    )
  );

-- ---------- QUIZ_ANSWERS: student SELECT, INSERT, UPDATE (course_id) ----------
DROP POLICY IF EXISTS "Students can insert own quiz answers" ON public.quiz_answers;
DROP POLICY IF EXISTS "Students can update own quiz answers" ON public.quiz_answers;
DROP POLICY IF EXISTS "Students can view own quiz answers" ON public.quiz_answers;

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
        public.is_student_enrolled_in_classroom(q.course_id)
      )
    )
  );

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
        public.is_student_enrolled_in_classroom(q.course_id)
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
        public.is_student_enrolled_in_classroom(q.course_id)
      )
    )
  );

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
        public.is_student_enrolled_in_classroom(q.course_id)
      )
    )
  );

-- ---------- EXAM_ANSWERS: student SELECT, INSERT, UPDATE (course_id) ----------
DROP POLICY IF EXISTS "Students can insert own exam answers" ON public.exam_answers;
DROP POLICY IF EXISTS "Students can update own exam answers" ON public.exam_answers;
DROP POLICY IF EXISTS "Students can view own exam answers" ON public.exam_answers;

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
        public.is_student_enrolled_in_classroom(e.course_id)
      )
    )
  );

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
        public.is_student_enrolled_in_classroom(e.course_id)
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
        public.is_student_enrolled_in_classroom(e.course_id)
      )
    )
  );

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
        public.is_student_enrolled_in_classroom(e.course_id)
      )
    )
  );
