-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user is teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user is student
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'student'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if student is enrolled in a classroom
CREATE OR REPLACE FUNCTION public.is_student_enrolled_in_classroom(classroom_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE student_id = auth.uid() 
    AND classroom_id = classroom_uuid 
    AND is_active = true
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to get user's classroom_ids (for students - returns array)
CREATE OR REPLACE FUNCTION public.get_student_classroom_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(classroom_id) FROM public.enrollments 
  WHERE student_id = auth.uid() AND is_active = true;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to get teacher's classroom_id
CREATE OR REPLACE FUNCTION public.get_teacher_classroom_id()
RETURNS UUID AS $$
  SELECT id FROM public.classrooms 
  WHERE teacher_id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Admins can update any profile (except making themselves non-admin)
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- CLASSROOMS POLICIES
-- ============================================

-- Teachers can view their own classroom
CREATE POLICY "Teachers can view own classroom"
  ON public.classrooms FOR SELECT
  USING (teacher_id = auth.uid());

-- Teachers can update their own classroom
CREATE POLICY "Teachers can update own classroom"
  ON public.classrooms FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Students can view their enrolled classrooms
CREATE POLICY "Students can view enrolled classrooms"
  ON public.classrooms FOR SELECT
  USING (
    public.is_student_enrolled_in_classroom(id)
  );

-- Admins can view all classrooms (read-only)
CREATE POLICY "Admins can view all classrooms"
  ON public.classrooms FOR SELECT
  USING (public.is_admin());

-- ============================================
-- ENROLLMENTS POLICIES
-- ============================================

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON public.enrollments FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can view enrollments in their classroom
CREATE POLICY "Teachers can view classroom enrollments"
  ON public.enrollments FOR SELECT
  USING (
    classroom_id = public.get_teacher_classroom_id()
  );

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments"
  ON public.enrollments FOR SELECT
  USING (public.is_admin());

-- Admins can insert enrollments (for manual enrollment)
CREATE POLICY "Admins can insert enrollments"
  ON public.enrollments FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can delete enrollments (remove students)
CREATE POLICY "Admins can delete enrollments"
  ON public.enrollments FOR DELETE
  USING (public.is_admin());

-- ============================================
-- COURSES POLICIES
-- ============================================

-- Teachers can manage courses in their classroom
CREATE POLICY "Teachers can manage own classroom courses"
  ON public.courses FOR ALL
  USING (
    classroom_id = public.get_teacher_classroom_id()
  )
  WITH CHECK (
    classroom_id = public.get_teacher_classroom_id()
  );

-- Students can view published courses in their enrolled classrooms
CREATE POLICY "Students can view published courses"
  ON public.courses FOR SELECT
  USING (
    public.is_student_enrolled_in_classroom(classroom_id) AND
    is_published = true
  );

-- Admins can view all courses
CREATE POLICY "Admins can view all courses"
  ON public.courses FOR SELECT
  USING (public.is_admin());

-- ============================================
-- LESSONS POLICIES
-- ============================================

-- Teachers can manage lessons in their courses
CREATE POLICY "Teachers can manage lessons"
  ON public.lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.classrooms cl ON c.classroom_id = cl.id
      WHERE c.id = lessons.course_id AND cl.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.classrooms cl ON c.classroom_id = cl.id
      WHERE c.id = lessons.course_id AND cl.teacher_id = auth.uid()
    )
  );

-- Students can view published lessons in their enrolled classrooms
CREATE POLICY "Students can view published lessons"
  ON public.lessons FOR SELECT
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = lessons.course_id AND
      public.is_student_enrolled_in_classroom(c.classroom_id) AND
      c.is_published = true
    )
  );

-- Admins can view all lessons
CREATE POLICY "Admins can view all lessons"
  ON public.lessons FOR SELECT
  USING (public.is_admin());

-- ============================================
-- QUIZZES POLICIES
-- ============================================

-- Teachers can manage quizzes in their courses
CREATE POLICY "Teachers can manage quizzes"
  ON public.quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.classrooms cl ON c.classroom_id = cl.id
      WHERE c.id = quizzes.course_id AND cl.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.classrooms cl ON c.classroom_id = cl.id
      WHERE c.id = quizzes.course_id AND cl.teacher_id = auth.uid()
    )
  );

-- Students can view published quizzes in their enrolled classrooms
CREATE POLICY "Students can view published quizzes"
  ON public.quizzes FOR SELECT
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = quizzes.course_id AND
      public.is_student_enrolled_in_classroom(c.classroom_id) AND
      c.is_published = true
    )
  );

-- Admins can view all quizzes
CREATE POLICY "Admins can view all quizzes"
  ON public.quizzes FOR SELECT
  USING (public.is_admin());

-- ============================================
-- EXAMS POLICIES
-- ============================================

-- Teachers can manage exams in their courses
CREATE POLICY "Teachers can manage exams"
  ON public.exams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.classrooms cl ON c.classroom_id = cl.id
      WHERE c.id = exams.course_id AND cl.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.classrooms cl ON c.classroom_id = cl.id
      WHERE c.id = exams.course_id AND cl.teacher_id = auth.uid()
    )
  );

-- Students can view published exams in their enrolled classrooms
CREATE POLICY "Students can view published exams"
  ON public.exams FOR SELECT
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = exams.course_id AND
      public.is_student_enrolled_in_classroom(c.classroom_id) AND
      c.is_published = true
    )
  );

-- Admins can view all exams
CREATE POLICY "Admins can view all exams"
  ON public.exams FOR SELECT
  USING (public.is_admin());

-- ============================================
-- QUIZ_QUESTIONS & EXAM_QUESTIONS POLICIES
-- ============================================

-- Teachers can manage questions in their quizzes
CREATE POLICY "Teachers can manage quiz questions"
  ON public.quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.courses c ON q.course_id = c.id
      JOIN public.classrooms cl ON c.classroom_id = cl.id
      WHERE q.id = quiz_questions.quiz_id AND cl.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.courses c ON q.course_id = c.id
      JOIN public.classrooms cl ON c.classroom_id = cl.id
      WHERE q.id = quiz_questions.quiz_id AND cl.teacher_id = auth.uid()
    )
  );

-- Students can view questions for published quizzes in their enrolled classrooms
CREATE POLICY "Students can view quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.courses c ON q.course_id = c.id
      WHERE q.id = quiz_questions.quiz_id AND
      q.is_published = true AND
      public.is_student_enrolled_in_classroom(c.classroom_id) AND
      c.is_published = true
    )
  );

-- Teachers can manage questions in their exams
CREATE POLICY "Teachers can manage exam questions"
  ON public.exam_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.courses c ON e.course_id = c.id
      JOIN public.classrooms cl ON c.classroom_id = cl.id
      WHERE e.id = exam_questions.exam_id AND cl.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.courses c ON e.course_id = c.id
      JOIN public.classrooms cl ON c.classroom_id = cl.id
      WHERE e.id = exam_questions.exam_id AND cl.teacher_id = auth.uid()
    )
  );

-- Students can view questions for published exams in their enrolled classrooms
CREATE POLICY "Students can view exam questions"
  ON public.exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.courses c ON e.course_id = c.id
      WHERE e.id = exam_questions.exam_id AND
      e.is_published = true AND
      public.is_student_enrolled_in_classroom(c.classroom_id) AND
      c.is_published = true
    )
  );

-- Admins can view all questions
CREATE POLICY "Admins can view all questions"
  ON public.quiz_questions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all exam questions"
  ON public.exam_questions FOR SELECT
  USING (public.is_admin());

-- ============================================
-- QUIZ_SUBMISSIONS POLICIES
-- ============================================

-- Students can create and view their own submissions
CREATE POLICY "Students can manage own quiz submissions"
  ON public.quiz_submissions FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Teachers can view submissions in their classroom
CREATE POLICY "Teachers can view classroom quiz submissions"
  ON public.quiz_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.courses c ON q.course_id = c.id
      WHERE q.id = quiz_submissions.quiz_id AND
      c.classroom_id = public.get_teacher_classroom_id()
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins can view all quiz submissions"
  ON public.quiz_submissions FOR SELECT
  USING (public.is_admin());

-- ============================================
-- QUIZ_ANSWERS POLICIES
-- ============================================

-- Students can manage answers for their own submissions
CREATE POLICY "Students can manage own quiz answers"
  ON public.quiz_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_submissions qs
      WHERE qs.id = quiz_answers.submission_id AND qs.student_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_submissions qs
      WHERE qs.id = quiz_answers.submission_id AND qs.student_id = auth.uid()
    )
  );

-- Teachers can view answers in their classroom
CREATE POLICY "Teachers can view classroom quiz answers"
  ON public.quiz_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_submissions qs
      JOIN public.quizzes q ON qs.quiz_id = q.id
      JOIN public.courses c ON q.course_id = c.id
      WHERE qs.id = quiz_answers.submission_id AND
      c.classroom_id = public.get_teacher_classroom_id()
    )
  );

-- Admins can view all answers
CREATE POLICY "Admins can view all quiz answers"
  ON public.quiz_answers FOR SELECT
  USING (public.is_admin());

-- ============================================
-- EXAM_SUBMISSIONS POLICIES
-- ============================================

-- Students can create and view their own submissions
CREATE POLICY "Students can manage own exam submissions"
  ON public.exam_submissions FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Teachers can view submissions in their classroom
CREATE POLICY "Teachers can view classroom exam submissions"
  ON public.exam_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.courses c ON e.course_id = c.id
      WHERE e.id = exam_submissions.exam_id AND
      c.classroom_id = public.get_teacher_classroom_id()
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins can view all exam submissions"
  ON public.exam_submissions FOR SELECT
  USING (public.is_admin());

-- ============================================
-- EXAM_ANSWERS POLICIES
-- ============================================

-- Students can manage answers for their own submissions
CREATE POLICY "Students can manage own exam answers"
  ON public.exam_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions es
      WHERE es.id = exam_answers.submission_id AND es.student_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_submissions es
      WHERE es.id = exam_answers.submission_id AND es.student_id = auth.uid()
    )
  );

-- Teachers can view answers in their classroom
CREATE POLICY "Teachers can view classroom exam answers"
  ON public.exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions es
      JOIN public.exams e ON es.exam_id = e.id
      JOIN public.courses c ON e.course_id = c.id
      WHERE es.id = exam_answers.submission_id AND
      c.classroom_id = public.get_teacher_classroom_id()
    )
  );

-- Admins can view all answers
CREATE POLICY "Admins can view all exam answers"
  ON public.exam_answers FOR SELECT
  USING (public.is_admin());

-- ============================================
-- LESSON_PROGRESS POLICIES
-- ============================================

-- Students can manage their own progress
CREATE POLICY "Students can manage own lesson progress"
  ON public.lesson_progress FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Teachers can view progress in their classroom
CREATE POLICY "Teachers can view classroom lesson progress"
  ON public.lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON l.course_id = c.id
      WHERE l.id = lesson_progress.lesson_id AND
      c.classroom_id = public.get_teacher_classroom_id()
    )
  );

-- Admins can view all progress
CREATE POLICY "Admins can view all lesson progress"
  ON public.lesson_progress FOR SELECT
  USING (public.is_admin());

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Users can send messages to users in their classrooms
CREATE POLICY "Users can send messages in classroom"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    (
      -- Student messaging teacher or admin in any enrolled classroom
      (public.is_student() AND classroom_id IS NOT NULL AND public.is_student_enrolled_in_classroom(classroom_id)) OR
      -- Teacher messaging students or admin in their classroom
      (public.is_teacher() AND classroom_id = public.get_teacher_classroom_id()) OR
      -- Admin can message anyone
      public.is_admin()
    )
  );

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

-- Users can update messages they sent (mark as read, etc.)
CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid() OR receiver_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (public.is_admin());
