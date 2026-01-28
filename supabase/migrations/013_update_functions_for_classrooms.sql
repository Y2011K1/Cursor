-- ============================================
-- Update Functions and Triggers for Classrooms
-- ============================================
-- Remove course-related triggers and update functions
-- This migration is idempotent and can be safely re-run
-- ============================================

-- Drop the update_courses_updated_at trigger (if courses table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'courses'
  ) THEN
    DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
  END IF;
END $$;

-- Note: All other functions and triggers remain the same since they work
-- with lessons, quizzes, exams directly, not through courses
