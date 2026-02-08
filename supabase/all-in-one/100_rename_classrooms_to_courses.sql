-- ============================================
-- CRITICAL: Rename classrooms table to courses
-- Affects ALL references throughout the app
-- ============================================

-- 1. Drop triggers that reference classrooms table (before rename)
DROP TRIGGER IF EXISTS ensure_one_classroom_per_teacher_trigger ON public.classrooms;
DROP TRIGGER IF EXISTS update_classrooms_updated_at ON public.classrooms;

-- 2. Rename the main table
ALTER TABLE public.classrooms RENAME TO courses;

-- 3. Rename foreign key columns
ALTER TABLE public.enrollments RENAME COLUMN classroom_id TO course_id;
ALTER TABLE public.lessons RENAME COLUMN classroom_id TO course_id;
ALTER TABLE public.quizzes RENAME COLUMN classroom_id TO course_id;
ALTER TABLE public.exams RENAME COLUMN classroom_id TO course_id;
ALTER TABLE public.course_materials RENAME COLUMN classroom_id TO course_id;
ALTER TABLE public.messages RENAME COLUMN classroom_id TO course_id;

-- 4. Recreate triggers on courses
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.ensure_one_course_per_teacher()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.courses
    WHERE teacher_id = NEW.teacher_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Teacher can only have one course';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_one_course_per_teacher_trigger
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_one_course_per_teacher();

-- 5. Update helper functions (keep names for backward compatibility with RLS)
CREATE OR REPLACE FUNCTION public.is_student_enrolled_in_classroom(classroom_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE student_id = auth.uid()
    AND course_id = classroom_uuid
    AND is_active = true
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_student_classroom_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(course_id) FROM public.enrollments
  WHERE student_id = auth.uid() AND is_active = true;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_teacher_classroom_id()
RETURNS UUID AS $$
  SELECT id FROM public.courses
  WHERE teacher_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 6. Rename indexes for clarity
DROP INDEX IF EXISTS idx_classrooms_teacher_id;
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
DROP INDEX IF EXISTS idx_enrollments_classroom_id;
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
DROP INDEX IF EXISTS idx_lessons_classroom_id;
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
DROP INDEX IF EXISTS idx_quizzes_classroom_id;
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON public.quizzes(course_id);
DROP INDEX IF EXISTS idx_exams_classroom_id;
CREATE INDEX IF NOT EXISTS idx_exams_course_id ON public.exams(course_id);
DROP INDEX IF EXISTS idx_course_materials_classroom_id;
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON public.course_materials(course_id);
DROP INDEX IF EXISTS idx_messages_classroom_id;
CREATE INDEX IF NOT EXISTS idx_messages_course_id ON public.messages(course_id);

-- Drop duplicate/legacy index names that may exist from later migrations
DROP INDEX IF EXISTS idx_classrooms_teacher_active;
CREATE INDEX IF NOT EXISTS idx_courses_teacher_active ON public.courses(teacher_id, is_active) WHERE is_active = true;
DROP INDEX IF EXISTS idx_lessons_classroom_published;
CREATE INDEX IF NOT EXISTS idx_lessons_course_published ON public.lessons(course_id, is_published) WHERE is_published = true;
DROP INDEX IF EXISTS idx_quizzes_classroom_published;
CREATE INDEX IF NOT EXISTS idx_quizzes_course_published ON public.quizzes(course_id, is_published) WHERE is_published = true;
DROP INDEX IF EXISTS idx_exams_classroom_published;
CREATE INDEX IF NOT EXISTS idx_exams_course_published ON public.exams(course_id, is_published) WHERE is_published = true;
DROP INDEX IF EXISTS idx_course_materials_classroom_published;
DROP INDEX IF EXISTS idx_materials_classroom_published;
CREATE INDEX IF NOT EXISTS idx_course_materials_course_published ON public.course_materials(course_id, is_published) WHERE is_published = true;
DROP INDEX IF EXISTS idx_enrollments_student_classroom_active;
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course_active ON public.enrollments(student_id, course_id, is_active) WHERE is_active = true;

-- 7. Drop policies that reference classroom_id (on tables we renamed column)
DROP POLICY IF EXISTS "Teachers can view classroom enrollments" ON public.enrollments;

CREATE POLICY "Teachers can view course enrollments"
  ON public.enrollments FOR SELECT
  USING (course_id = public.get_teacher_classroom_id());

-- Lessons: policies reference classroom_id in joins - drop and recreate
DROP POLICY IF EXISTS "Teachers can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Students can view published lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can view all lessons" ON public.lessons;

CREATE POLICY "Teachers can manage lessons"
  ON public.lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = lessons.course_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = lessons.course_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view published lessons"
  ON public.lessons FOR SELECT
  USING (
    is_published = true AND
    public.is_student_enrolled_in_classroom(course_id)
  );

CREATE POLICY "Admins can view all lessons"
  ON public.lessons FOR SELECT
  USING (public.is_admin());

-- Quizzes
DROP POLICY IF EXISTS "Teachers can manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Students can view published quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Admins can view all quizzes" ON public.quizzes;

CREATE POLICY "Teachers can manage quizzes"
  ON public.quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = quizzes.course_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = quizzes.course_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view published quizzes"
  ON public.quizzes FOR SELECT
  USING (
    is_published = true AND
    public.is_student_enrolled_in_classroom(course_id)
  );

CREATE POLICY "Admins can view all quizzes"
  ON public.quizzes FOR SELECT
  USING (public.is_admin());

-- Exams
DROP POLICY IF EXISTS "Teachers can manage exams" ON public.exams;
DROP POLICY IF EXISTS "Students can view published exams" ON public.exams;
DROP POLICY IF EXISTS "Admins can view all exams" ON public.exams;

CREATE POLICY "Teachers can manage exams"
  ON public.exams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = exams.course_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = exams.course_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view published exams"
  ON public.exams FOR SELECT
  USING (
    is_published = true AND
    public.is_student_enrolled_in_classroom(course_id)
  );

CREATE POLICY "Admins can view all exams"
  ON public.exams FOR SELECT
  USING (public.is_admin());

-- Course materials
DROP POLICY IF EXISTS "Teachers can manage course materials" ON public.course_materials;
DROP POLICY IF EXISTS "Students can view published course materials" ON public.course_materials;

CREATE POLICY "Teachers can manage course materials"
  ON public.course_materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_materials.course_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_materials.course_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view published course materials"
  ON public.course_materials FOR SELECT
  USING (
    is_published = true AND
    public.is_student_enrolled_in_classroom(course_id)
  );

-- Quiz questions (join via quizzes.course_id)
DROP POLICY IF EXISTS "Teachers can manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Students can view quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admins can view all quiz questions" ON public.quiz_questions;

CREATE POLICY "Teachers can manage quiz questions"
  ON public.quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.courses c ON c.id = q.course_id
      WHERE q.id = quiz_questions.quiz_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.courses c ON c.id = q.course_id
      WHERE q.id = quiz_questions.quiz_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_questions.quiz_id
      AND q.is_published = true
      AND public.is_student_enrolled_in_classroom(q.course_id)
    )
  );

CREATE POLICY "Admins can view all quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (public.is_admin());

-- Exam questions
DROP POLICY IF EXISTS "Teachers can manage exam questions" ON public.exam_questions;
DROP POLICY IF EXISTS "Students can view exam questions" ON public.exam_questions;
DROP POLICY IF EXISTS "Admins can view all exam questions" ON public.exam_questions;

CREATE POLICY "Teachers can manage exam questions"
  ON public.exam_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.courses c ON c.id = e.course_id
      WHERE e.id = exam_questions.exam_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.courses c ON c.id = e.course_id
      WHERE e.id = exam_questions.exam_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view exam questions"
  ON public.exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_questions.exam_id
      AND e.is_published = true
      AND public.is_student_enrolled_in_classroom(e.course_id)
    )
  );

CREATE POLICY "Admins can view all exam questions"
  ON public.exam_questions FOR SELECT
  USING (public.is_admin());

-- Quiz submissions
DROP POLICY IF EXISTS "Teachers can view quiz submissions" ON public.quiz_submissions;
DROP POLICY IF EXISTS "Teachers can view classroom quiz submissions" ON public.quiz_submissions;

CREATE POLICY "Teachers can view quiz submissions"
  ON public.quiz_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.courses c ON c.id = q.course_id
      WHERE q.id = quiz_submissions.quiz_id AND c.teacher_id = auth.uid()
    )
  );

-- Quiz answers
DROP POLICY IF EXISTS "Teachers can view classroom quiz answers" ON public.quiz_answers;
DROP POLICY IF EXISTS "Teachers can view quiz answers" ON public.quiz_answers;

CREATE POLICY "Teachers can view quiz answers"
  ON public.quiz_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_submissions qs
      JOIN public.quizzes q ON q.id = qs.quiz_id
      JOIN public.courses c ON c.id = q.course_id
      WHERE qs.id = quiz_answers.submission_id AND c.teacher_id = auth.uid()
    )
  );

-- Exam submissions
DROP POLICY IF EXISTS "Teachers can view exam submissions" ON public.exam_submissions;
DROP POLICY IF EXISTS "Teachers can view classroom exam submissions" ON public.exam_submissions;

CREATE POLICY "Teachers can view exam submissions"
  ON public.exam_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.courses c ON c.id = e.course_id
      WHERE e.id = exam_submissions.exam_id AND c.teacher_id = auth.uid()
    )
  );

-- Exam answers
DROP POLICY IF EXISTS "Teachers can view classroom exam answers" ON public.exam_answers;
DROP POLICY IF EXISTS "Teachers can view exam answers" ON public.exam_answers;

CREATE POLICY "Teachers can view exam answers"
  ON public.exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_submissions es
      JOIN public.exams e ON e.id = es.exam_id
      JOIN public.courses c ON c.id = e.course_id
      WHERE es.id = exam_answers.submission_id AND c.teacher_id = auth.uid()
    )
  );

-- Lesson progress
DROP POLICY IF EXISTS "Teachers can view lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Teachers can view classroom lesson progress" ON public.lesson_progress;

CREATE POLICY "Teachers can view lesson progress"
  ON public.lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id = lesson_progress.lesson_id AND c.teacher_id = auth.uid()
    )
  );

-- Messages (policy uses classroom_id)
DROP POLICY IF EXISTS "Users can send messages in classroom" ON public.messages;

CREATE POLICY "Users can send messages in course"
  ON public.messages FOR INSERT
  WITH CHECK (
    (public.is_student() AND course_id IS NOT NULL AND public.is_student_enrolled_in_classroom(course_id)) OR
    (public.is_teacher() AND course_id = public.get_teacher_classroom_id()) OR
    public.is_admin()
  );

-- Material access (policy joins course_materials to classrooms)
DROP POLICY IF EXISTS "Teachers can view classroom material access" ON public.material_access;

CREATE POLICY "Teachers can view course material access"
  ON public.material_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_materials cm
      JOIN public.courses c ON c.id = cm.course_id
      WHERE cm.id = material_access.material_id AND c.teacher_id = auth.uid()
    )
  );

-- Policies ON the courses table (formerly classrooms): update policy names for clarity
DROP POLICY IF EXISTS "Teachers can view own classroom" ON public.courses;
DROP POLICY IF EXISTS "Teachers can update own classroom" ON public.courses;
DROP POLICY IF EXISTS "Students can view enrolled classrooms" ON public.courses;
DROP POLICY IF EXISTS "Admins can view all classrooms" ON public.courses;
DROP POLICY IF EXISTS "Students can browse active classrooms" ON public.courses;

CREATE POLICY "Teachers can view own course"
  ON public.courses FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own course"
  ON public.courses FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Students can view enrolled courses"
  ON public.courses FOR SELECT
  USING (public.is_student_enrolled_in_classroom(id));

CREATE POLICY "Admins can view all courses"
  ON public.courses FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Students can browse active courses"
  ON public.courses FOR SELECT
  USING (is_active = true);

-- 8. Update admin_setup_teacher to use courses and return course_id
CREATE OR REPLACE FUNCTION public.admin_setup_teacher(
  teacher_user_id UUID,
  teacher_full_name TEXT,
  classroom_name TEXT DEFAULT 'My Course',
  classroom_description TEXT DEFAULT '',
  max_students INTEGER DEFAULT 10,
  classroom_subject TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  new_course_id UUID;
  result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can set up teacher accounts';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = teacher_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (teacher_user_id, teacher_full_name, 'teacher')
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name, role = 'teacher';

  INSERT INTO public.courses (teacher_id, name, description, max_students, subject)
  VALUES (teacher_user_id, classroom_name, classroom_description, max_students, classroom_subject)
  RETURNING id INTO new_course_id;

  result := jsonb_build_object(
    'success', true,
    'user_id', teacher_user_id,
    'course_id', new_course_id,
    'message', 'Teacher profile and course created successfully'
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Update admin_remove_student to use course_id
CREATE OR REPLACE FUNCTION public.admin_remove_student(
  student_id_param UUID,
  classroom_id_param UUID
)
RETURNS JSONB AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can remove students';
  END IF;
  UPDATE public.enrollments
  SET is_active = false
  WHERE student_id = student_id_param
    AND course_id = classroom_id_param
    AND is_active = true;
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Student removed from course'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Update admin_enroll_student to use course_id
CREATE OR REPLACE FUNCTION public.admin_enroll_student(
  student_id_param UUID,
  classroom_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
  enrollment_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can enroll students';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE student_id = student_id_param
    AND course_id = classroom_id_param
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Student is already enrolled in this course';
  END IF;
  INSERT INTO public.enrollments (student_id, course_id, is_active)
  VALUES (student_id_param, classroom_id_param, true)
  RETURNING id INTO enrollment_id;
  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', enrollment_id,
    'message', 'Student enrolled successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Update enrollment validation trigger function (references classrooms/course_id)
CREATE OR REPLACE FUNCTION public.validate_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  course_max_students INTEGER;
  current_enrollments INTEGER;
BEGIN
  IF NOT public.is_student() THEN
    RAISE EXCEPTION 'Only students can be enrolled in courses';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE student_id = NEW.student_id AND course_id = NEW.course_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Student is already enrolled in this course';
  END IF;
  SELECT c.max_students INTO course_max_students
  FROM public.courses c
  WHERE c.id = NEW.course_id;
  SELECT COUNT(*) INTO current_enrollments
  FROM public.enrollments
  WHERE course_id = NEW.course_id AND is_active = true;
  IF current_enrollments >= course_max_students THEN
    RAISE EXCEPTION 'Course is full (max % students)', course_max_students;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Teachers can view classroom student profiles -> course
DROP POLICY IF EXISTS "Teachers can view classroom student profiles" ON public.profiles;

CREATE POLICY "Teachers can view course student profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_teacher() AND
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.student_id = profiles.id
      AND e.course_id = public.get_teacher_classroom_id()
      AND e.is_active = true
    )
  );
