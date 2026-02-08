-- ============================================
-- Fix Enrollment Ambiguous Column Error
-- Allow Students to View Teacher Profiles
-- ============================================

-- Fix the ambiguous column error in validate_enrollment function
CREATE OR REPLACE FUNCTION public.validate_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  current_enrollments INTEGER;
  classroom_max_students INTEGER;
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
  
  -- Check classroom capacity (use fully qualified column name to avoid ambiguity)
  SELECT c.max_students INTO classroom_max_students
  FROM public.classrooms c
  WHERE c.id = NEW.classroom_id;
  
  SELECT COUNT(*) INTO current_enrollments
  FROM public.enrollments
  WHERE classroom_id = NEW.classroom_id
  AND is_active = true
  AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
  
  IF current_enrollments >= classroom_max_students THEN
    RAISE EXCEPTION 'Classroom is full (max % students)', classroom_max_students;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Allow students to view teacher profiles when browsing classrooms
CREATE POLICY "Students can view teacher profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_student() AND
    role = 'teacher'
  );
