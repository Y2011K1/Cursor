-- ============================================
-- DATABASE FUNCTIONS & TRIGGERS
-- ============================================

-- ============================================
-- FUNCTION: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
BEGIN
  -- Get role and full_name from user metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Validate role
  IF user_role NOT IN ('admin', 'teacher', 'student') THEN
    user_role := 'student';
  END IF;
  
  -- Insert into profiles
  -- Note: Teachers are added by admins, not through signup
  -- Only students and admins can sign up directly
  IF user_role = 'teacher' THEN
    user_role := 'student'; -- Prevent teacher signup, default to student
  END IF;
  
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, user_full_name, user_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classrooms_updated_at
  BEFORE UPDATE ON public.classrooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FUNCTION: Validate enrollment constraints
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  current_enrollments INTEGER;
  max_students INTEGER;
  student_role TEXT;
BEGIN
  -- Check if user is a student
  SELECT role INTO student_role FROM public.profiles WHERE id = NEW.student_id;
  
  IF student_role != 'student' THEN
    RAISE EXCEPTION 'Only students can be enrolled in classrooms';
  END IF;
  
  -- Check if student is already enrolled in this specific classroom
  IF EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE student_id = NEW.student_id
    AND classroom_id = NEW.classroom_id
    AND is_active = true
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ) THEN
    RAISE EXCEPTION 'Student is already enrolled in this classroom';
  END IF;
  
  -- Check classroom capacity
  SELECT max_students INTO max_students
  FROM public.classrooms
  WHERE id = NEW.classroom_id;
  
  SELECT COUNT(*) INTO current_enrollments
  FROM public.enrollments
  WHERE classroom_id = NEW.classroom_id
  AND is_active = true
  AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
  
  IF current_enrollments >= max_students THEN
    RAISE EXCEPTION 'Classroom is full (max % students)', max_students;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate enrollment
CREATE TRIGGER validate_enrollment_before_insert
  BEFORE INSERT OR UPDATE ON public.enrollments
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.validate_enrollment();

-- ============================================
-- FUNCTION: Auto-grade quiz submission
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_grade_quiz_submission(submission_uuid UUID)
RETURNS VOID AS $$
DECLARE
  calculated_score INTEGER := 0;
  calculated_total_points INTEGER := 0;
  quiz_uuid UUID;
BEGIN
  -- Get quiz_id from submission
  SELECT quiz_id INTO quiz_uuid
  FROM public.quiz_submissions
  WHERE id = submission_uuid;
  
  -- Calculate total points
  SELECT COALESCE(SUM(points), 0) INTO calculated_total_points
  FROM public.quiz_questions
  WHERE quiz_id = quiz_uuid;
  
  -- Calculate score from answers
  SELECT COALESCE(SUM(points_earned), 0) INTO calculated_score
  FROM public.quiz_answers
  WHERE submission_id = submission_uuid;
  
  -- Update submission (use renamed variables to avoid ambiguity)
  UPDATE public.quiz_submissions qs
  SET 
    score = calculated_score,
    total_points = calculated_total_points,
    is_completed = true,
    submitted_at = NOW()
  WHERE qs.id = submission_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Auto-grade exam submission
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_grade_exam_submission(submission_uuid UUID)
RETURNS VOID AS $$
DECLARE
  calculated_score INTEGER := 0;
  calculated_total_points INTEGER := 0;
  exam_uuid UUID;
BEGIN
  -- Get exam_id from submission
  SELECT exam_id INTO exam_uuid
  FROM public.exam_submissions
  WHERE id = submission_uuid;
  
  -- Calculate total points
  SELECT COALESCE(SUM(points), 0) INTO calculated_total_points
  FROM public.exam_questions
  WHERE exam_id = exam_uuid;
  
  -- Calculate score from answers
  SELECT COALESCE(SUM(points_earned), 0) INTO calculated_score
  FROM public.exam_answers
  WHERE submission_id = submission_uuid;
  
  -- Update submission (use renamed variables to avoid ambiguity)
  UPDATE public.exam_submissions es
  SET 
    score = calculated_score,
    total_points = calculated_total_points,
    is_completed = true,
    submitted_at = NOW()
  WHERE es.id = submission_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Auto-calculate answer correctness
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_quiz_answer_score()
RETURNS TRIGGER AS $$
DECLARE
  correct_answer_value TEXT;
  question_points INTEGER;
BEGIN
  -- Get correct answer and points
  SELECT qq.correct_answer, qq.points INTO correct_answer_value, question_points
  FROM public.quiz_questions qq
  WHERE qq.id = NEW.question_id;
  
  -- Check if answer is correct
  IF NEW.selected_answer = correct_answer_value THEN
    NEW.is_correct := true;
    NEW.points_earned := question_points;
  ELSE
    NEW.is_correct := false;
    NEW.points_earned := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate quiz answer scores
CREATE TRIGGER calculate_quiz_answer_score_trigger
  BEFORE INSERT OR UPDATE ON public.quiz_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_quiz_answer_score();

-- Function to calculate exam answer scores (similar to quiz)
CREATE OR REPLACE FUNCTION public.calculate_exam_answer_score()
RETURNS TRIGGER AS $$
DECLARE
  correct_answer_value TEXT;
  question_points INTEGER;
BEGIN
  -- Get correct answer and points
  SELECT eq.correct_answer, eq.points INTO correct_answer_value, question_points
  FROM public.exam_questions eq
  WHERE eq.id = NEW.question_id;
  
  -- Check if answer is correct
  IF NEW.selected_answer = correct_answer_value THEN
    NEW.is_correct := true;
    NEW.points_earned := question_points;
  ELSE
    NEW.is_correct := false;
    NEW.points_earned := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate exam answer scores
CREATE TRIGGER calculate_exam_answer_score_trigger
  BEFORE INSERT OR UPDATE ON public.exam_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_exam_answer_score();

-- ============================================
-- FUNCTION: Prevent multiple exam attempts
-- ============================================
CREATE OR REPLACE FUNCTION public.prevent_multiple_exam_attempts()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.exam_submissions
    WHERE exam_id = NEW.exam_id
    AND student_id = NEW.student_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ) THEN
    RAISE EXCEPTION 'Only one attempt allowed per exam';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent multiple exam attempts
CREATE TRIGGER prevent_multiple_exam_attempts_trigger
  BEFORE INSERT ON public.exam_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_multiple_exam_attempts();

-- ============================================
-- FUNCTION: Ensure teacher has only one classroom
-- ============================================
CREATE OR REPLACE FUNCTION public.ensure_one_classroom_per_teacher()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE teacher_id = NEW.teacher_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ) THEN
    RAISE EXCEPTION 'Teacher can only have one classroom';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure one classroom per teacher
CREATE TRIGGER ensure_one_classroom_per_teacher_trigger
  BEFORE INSERT OR UPDATE ON public.classrooms
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_one_classroom_per_teacher();
