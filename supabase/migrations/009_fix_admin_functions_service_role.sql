-- ============================================
-- Fix Admin Functions for Service Role Usage
-- ============================================
-- When using service role key, auth.uid() returns NULL
-- Since we already check admin role in server actions,
-- we can remove the is_admin() check from these functions
-- ============================================

-- Fix admin_setup_teacher function
CREATE OR REPLACE FUNCTION public.admin_setup_teacher(
  teacher_user_id UUID,
  teacher_full_name TEXT,
  classroom_name TEXT DEFAULT 'My Classroom',
  classroom_description TEXT DEFAULT '',
  max_students INTEGER DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
  new_classroom_id UUID;
  result JSONB;
BEGIN
  -- Note: Admin check is done in the server action (requireRole("admin"))
  -- Service role key bypasses auth.uid(), so we skip the check here
  
  -- Check if user exists in auth
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = teacher_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Create or update profile with teacher role
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (teacher_user_id, teacher_full_name, 'teacher')
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name, role = 'teacher';

  -- Create classroom for teacher
  INSERT INTO public.classrooms (teacher_id, name, description, max_students)
  VALUES (teacher_user_id, classroom_name, classroom_description, max_students)
  RETURNING id INTO new_classroom_id;

  -- Return result
  result := jsonb_build_object(
    'success', true,
    'user_id', teacher_user_id,
    'classroom_id', new_classroom_id,
    'message', 'Teacher profile and classroom created successfully'
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix admin_remove_student function
CREATE OR REPLACE FUNCTION public.admin_remove_student(
  student_id_param UUID,
  classroom_id_param UUID
)
RETURNS JSONB AS $$
BEGIN
  -- Note: Admin check is done in the server action
  -- Service role key bypasses auth.uid(), so we skip the check here

  -- Deactivate enrollment
  UPDATE public.enrollments
  SET is_active = false
  WHERE student_id = student_id_param
    AND classroom_id = classroom_id_param
    AND is_active = true;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Student removed from classroom'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix admin_remove_teacher function
CREATE OR REPLACE FUNCTION public.admin_remove_teacher(
  teacher_id_param UUID
)
RETURNS JSONB AS $$
BEGIN
  -- Note: Admin check is done in the server action
  -- Service role key bypasses auth.uid(), so we skip the check here

  -- Check if teacher exists
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = teacher_id_param AND role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'User is not a teacher';
  END IF;

  -- Delete teacher (cascade will handle classroom, courses, etc.)
  DELETE FROM auth.users WHERE id = teacher_id_param;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Teacher and associated classroom removed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix admin_enroll_student function
CREATE OR REPLACE FUNCTION public.admin_enroll_student(
  student_id_param UUID,
  classroom_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
  enrollment_id UUID;
BEGIN
  -- Note: Admin check is done in the server action
  -- Service role key bypasses auth.uid(), so we skip the check here

  -- Check if student is already enrolled in this specific classroom
  IF EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE student_id = student_id_param
    AND classroom_id = classroom_id_param
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Student is already enrolled in this classroom';
  END IF;

  -- Create enrollment
  INSERT INTO public.enrollments (student_id, classroom_id, is_active)
  VALUES (student_id_param, classroom_id_param, true)
  RETURNING id INTO enrollment_id;

  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', enrollment_id,
    'message', 'Student enrolled successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
