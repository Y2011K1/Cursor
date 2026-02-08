-- ============================================
-- Remove Courses - Link Everything to Classrooms
-- ============================================
-- Each classroom has a subject and directly contains lessons, quizzes, and exams
-- This migration is idempotent and can be safely re-run
-- ============================================

-- Step 1: Add subject field to classrooms (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classrooms' 
    AND column_name = 'subject'
  ) THEN
    ALTER TABLE public.classrooms ADD COLUMN subject TEXT;
  END IF;
END $$;

-- Step 2: Check if course_id columns exist and handle them
DO $$
BEGIN
  -- Check if lessons table has course_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons' 
    AND column_name = 'course_id'
  ) THEN
    -- Drop NOT NULL constraint if it exists
    BEGIN
      ALTER TABLE public.lessons ALTER COLUMN course_id DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore if constraint doesn't exist or already dropped
      NULL;
    END;
  END IF;

  -- Check if quizzes table has course_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quizzes' 
    AND column_name = 'course_id'
  ) THEN
    BEGIN
      ALTER TABLE public.quizzes ALTER COLUMN course_id DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  -- Check if exams table has course_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exams' 
    AND column_name = 'course_id'
  ) THEN
    BEGIN
      ALTER TABLE public.exams ALTER COLUMN course_id DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- Step 3: Add classroom_id columns if they don't exist
DO $$
BEGIN
  -- Add classroom_id to lessons
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons' 
    AND column_name = 'classroom_id'
  ) THEN
    ALTER TABLE public.lessons 
    ADD COLUMN classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE;
  END IF;

  -- Add classroom_id to quizzes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quizzes' 
    AND column_name = 'classroom_id'
  ) THEN
    ALTER TABLE public.quizzes 
    ADD COLUMN classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE;
  END IF;

  -- Add classroom_id to exams
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exams' 
    AND column_name = 'classroom_id'
  ) THEN
    ALTER TABLE public.exams 
    ADD COLUMN classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 4: Migrate data from courses to classrooms (only if courses table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'courses'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons' 
    AND column_name = 'course_id'
  ) THEN
    -- Migrate lessons
    UPDATE public.lessons l
    SET classroom_id = c.classroom_id
    FROM public.courses c
    WHERE l.course_id = c.id
      AND l.course_id IS NOT NULL
      AND l.classroom_id IS NULL;

    -- Migrate quizzes
    UPDATE public.quizzes q
    SET classroom_id = c.classroom_id
    FROM public.courses c
    WHERE q.course_id = c.id
      AND q.course_id IS NOT NULL
      AND q.classroom_id IS NULL;

    -- Migrate exams
    UPDATE public.exams e
    SET classroom_id = c.classroom_id
    FROM public.courses c
    WHERE e.course_id = c.id
      AND e.course_id IS NOT NULL
      AND e.classroom_id IS NULL;
  END IF;
END $$;

-- Step 5: Drop RLS policies that reference course_id BEFORE dropping columns
-- This must be done before dropping the columns, as policies depend on them
DO $$
BEGIN
  -- Drop lessons policies that reference course_id
  DROP POLICY IF EXISTS "Teachers can manage lessons" ON public.lessons;
  DROP POLICY IF EXISTS "Students can view published lessons" ON public.lessons;
  DROP POLICY IF EXISTS "Admins can view all lessons" ON public.lessons;
  
  -- Drop quizzes policies that reference course_id
  DROP POLICY IF EXISTS "Teachers can manage quizzes" ON public.quizzes;
  DROP POLICY IF EXISTS "Students can view published quizzes" ON public.quizzes;
  DROP POLICY IF EXISTS "Admins can view all quizzes" ON public.quizzes;
  
  -- Drop exams policies that reference course_id
  DROP POLICY IF EXISTS "Teachers can manage exams" ON public.exams;
  DROP POLICY IF EXISTS "Students can view published exams" ON public.exams;
  DROP POLICY IF EXISTS "Admins can view all exams" ON public.exams;
  
  -- Drop quiz_questions policies that reference course_id
  DROP POLICY IF EXISTS "Teachers can manage quiz questions" ON public.quiz_questions;
  DROP POLICY IF EXISTS "Students can view quiz questions" ON public.quiz_questions;
  DROP POLICY IF EXISTS "Admins can view all quiz questions" ON public.quiz_questions;
  
  -- Drop exam_questions policies that reference course_id
  DROP POLICY IF EXISTS "Teachers can manage exam questions" ON public.exam_questions;
  DROP POLICY IF EXISTS "Students can view exam questions" ON public.exam_questions;
  DROP POLICY IF EXISTS "Admins can view all exam questions" ON public.exam_questions;
  
  -- Drop quiz_submissions policies that reference course_id
  DROP POLICY IF EXISTS "Students can submit quizzes" ON public.quiz_submissions;
  DROP POLICY IF EXISTS "Students can view own quiz submissions" ON public.quiz_submissions;
  DROP POLICY IF EXISTS "Students can manage own quiz submissions" ON public.quiz_submissions;
  DROP POLICY IF EXISTS "Teachers can view quiz submissions" ON public.quiz_submissions;
  DROP POLICY IF EXISTS "Teachers can view classroom quiz submissions" ON public.quiz_submissions;
  DROP POLICY IF EXISTS "Admins can view all quiz submissions" ON public.quiz_submissions;
  
  -- Drop quiz_answers policies that reference course_id
  DROP POLICY IF EXISTS "Students can manage own quiz answers" ON public.quiz_answers;
  DROP POLICY IF EXISTS "Teachers can view classroom quiz answers" ON public.quiz_answers;
  DROP POLICY IF EXISTS "Admins can view all quiz answers" ON public.quiz_answers;
  
  -- Drop exam_submissions policies that reference course_id
  DROP POLICY IF EXISTS "Students can submit exams" ON public.exam_submissions;
  DROP POLICY IF EXISTS "Students can view own exam submissions" ON public.exam_submissions;
  DROP POLICY IF EXISTS "Students can manage own exam submissions" ON public.exam_submissions;
  DROP POLICY IF EXISTS "Teachers can view exam submissions" ON public.exam_submissions;
  DROP POLICY IF EXISTS "Teachers can view classroom exam submissions" ON public.exam_submissions;
  DROP POLICY IF EXISTS "Admins can view all exam submissions" ON public.exam_submissions;
  
  -- Drop exam_answers policies that reference course_id
  DROP POLICY IF EXISTS "Students can manage own exam answers" ON public.exam_answers;
  DROP POLICY IF EXISTS "Teachers can view classroom exam answers" ON public.exam_answers;
  DROP POLICY IF EXISTS "Admins can view all exam answers" ON public.exam_answers;
  
  -- Drop lesson_progress policies that reference course_id
  DROP POLICY IF EXISTS "Students can manage own lesson progress" ON public.lesson_progress;
  DROP POLICY IF EXISTS "Teachers can view lesson progress" ON public.lesson_progress;
  DROP POLICY IF EXISTS "Teachers can view classroom lesson progress" ON public.lesson_progress;
  DROP POLICY IF EXISTS "Admins can view all lesson progress" ON public.lesson_progress;
  
  -- Drop course-related policies
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'courses'
  ) THEN
    DROP POLICY IF EXISTS "Teachers can manage own classroom courses" ON public.courses;
    DROP POLICY IF EXISTS "Students can view published courses" ON public.courses;
    DROP POLICY IF EXISTS "Admins can view all courses" ON public.courses;
  END IF;
END $$;

-- Step 6: Drop foreign key constraints on course_id (if they exist)
DO $$
BEGIN
  -- Drop lessons_course_id_fkey
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'lessons' 
    AND constraint_name = 'lessons_course_id_fkey'
  ) THEN
    ALTER TABLE public.lessons DROP CONSTRAINT lessons_course_id_fkey;
  END IF;

  -- Drop quizzes_course_id_fkey
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'quizzes' 
    AND constraint_name = 'quizzes_course_id_fkey'
  ) THEN
    ALTER TABLE public.quizzes DROP CONSTRAINT quizzes_course_id_fkey;
  END IF;

  -- Drop exams_course_id_fkey
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'exams' 
    AND constraint_name = 'exams_course_id_fkey'
  ) THEN
    ALTER TABLE public.exams DROP CONSTRAINT exams_course_id_fkey;
  END IF;
END $$;

-- Step 7: Drop course_id columns (if they exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons' 
    AND column_name = 'course_id'
  ) THEN
    ALTER TABLE public.lessons DROP COLUMN course_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quizzes' 
    AND column_name = 'course_id'
  ) THEN
    ALTER TABLE public.quizzes DROP COLUMN course_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exams' 
    AND column_name = 'course_id'
  ) THEN
    ALTER TABLE public.exams DROP COLUMN course_id;
  END IF;
END $$;

-- Step 8: Delete any orphaned records (safety check)
DELETE FROM public.lessons WHERE classroom_id IS NULL;
DELETE FROM public.quizzes WHERE classroom_id IS NULL;
DELETE FROM public.exams WHERE classroom_id IS NULL;

-- Step 9: Make classroom_id NOT NULL (if column exists and is nullable)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons' 
    AND column_name = 'classroom_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.lessons ALTER COLUMN classroom_id SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quizzes' 
    AND column_name = 'classroom_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.quizzes ALTER COLUMN classroom_id SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exams' 
    AND column_name = 'classroom_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.exams ALTER COLUMN classroom_id SET NOT NULL;
  END IF;
END $$;

-- Step 10: Drop old indexes (if they exist)
DROP INDEX IF EXISTS idx_courses_classroom_id;
DROP INDEX IF EXISTS idx_lessons_course_id;
DROP INDEX IF EXISTS idx_quizzes_course_id;
DROP INDEX IF EXISTS idx_exams_course_id;

-- Step 11: Drop courses table (if it exists)
DROP TABLE IF EXISTS public.courses CASCADE;

-- Step 11: Create new indexes for classroom_id (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_lessons_classroom_id ON public.lessons(classroom_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_classroom_id ON public.quizzes(classroom_id);
CREATE INDEX IF NOT EXISTS idx_exams_classroom_id ON public.exams(classroom_id);

-- Step 13: Update admin_setup_teacher function
CREATE OR REPLACE FUNCTION public.admin_setup_teacher(
  teacher_user_id UUID,
  teacher_full_name TEXT,
  classroom_name TEXT DEFAULT 'My Classroom',
  classroom_description TEXT DEFAULT '',
  max_students INTEGER DEFAULT 10,
  classroom_subject TEXT DEFAULT NULL
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
  INSERT INTO public.classrooms (teacher_id, name, description, max_students, subject)
  VALUES (teacher_user_id, classroom_name, classroom_description, max_students, classroom_subject)
  RETURNING id INTO new_classroom_id;

  -- Return result (no course creation)
  result := jsonb_build_object(
    'success', true,
    'user_id', teacher_user_id,
    'classroom_id', new_classroom_id,
    'message', 'Teacher profile and classroom created successfully'
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
