-- Fix admin_setup_teacher to work with service role client.
-- The server action already checks admin role (requireRole(\"admin\")),
-- so this function should not rely on public.is_admin() or auth.uid().

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
  -- Check if user exists in auth
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = teacher_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Create or update profile with teacher role
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (teacher_user_id, teacher_full_name, 'teacher')
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name, role = 'teacher';

  -- Create course for teacher
  INSERT INTO public.courses (teacher_id, name, description, max_students, subject)
  VALUES (teacher_user_id, classroom_name, classroom_description, max_students, classroom_subject)
  RETURNING id INTO new_course_id;

  -- Return result
  result := jsonb_build_object(
    'success', true,
    'user_id', teacher_user_id,
    'course_id', new_course_id,
    'message', 'Teacher profile and course created successfully'
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

