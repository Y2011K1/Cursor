-- ============================================
-- Performance Optimization Migration
-- Add missing indexes and optimize queries
-- ============================================

-- Drop old course_id indexes if they exist (from migration 011)
DROP INDEX IF EXISTS idx_lessons_course_id;
DROP INDEX IF EXISTS idx_quizzes_course_id;
DROP INDEX IF EXISTS idx_exams_course_id;
DROP INDEX IF EXISTS idx_courses_classroom_id;

-- Add critical indexes for classroom_id (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_lessons_classroom_id ON public.lessons(classroom_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_classroom_id ON public.quizzes(classroom_id);
CREATE INDEX IF NOT EXISTS idx_exams_classroom_id ON public.exams(classroom_id);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_lessons_classroom_published ON public.lessons(classroom_id, is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_quizzes_classroom_published ON public.quizzes(classroom_id, is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_exams_classroom_published ON public.exams(classroom_id, is_published) WHERE is_published = true;

-- Add indexes for enrollment queries
CREATE INDEX IF NOT EXISTS idx_enrollments_student_active ON public.enrollments(student_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_enrollments_classroom_active ON public.enrollments(classroom_id, is_active) WHERE is_active = true;

-- Add indexes for submission queries
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student_completed ON public.quiz_submissions(student_id, is_completed) WHERE is_completed = true;
CREATE INDEX IF NOT EXISTS idx_exam_submissions_student_completed ON public.exam_submissions(student_id, is_completed) WHERE is_completed = true;
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_student ON public.quiz_submissions(quiz_id, student_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam_student ON public.exam_submissions(exam_id, student_id);

-- Add index for classroom active status
CREATE INDEX IF NOT EXISTS idx_classrooms_active ON public.classrooms(is_active) WHERE is_active = true;

-- Add index for profiles role
CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON public.profiles(role) WHERE role IN ('teacher', 'student', 'admin');

-- Add index for exam due dates
CREATE INDEX IF NOT EXISTS idx_exams_due_date_active ON public.exams(due_date) WHERE due_date IS NOT NULL AND is_published = true;

-- Add index for order_index in lessons (for sorting)
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON public.lessons(classroom_id, order_index);

-- Add index for created_at in quizzes and exams (for sorting)
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON public.quizzes(classroom_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exams_created_at ON public.exams(classroom_id, created_at DESC);

-- Optimize lesson_progress queries
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_lesson ON public.lesson_progress(student_id, lesson_id);

-- Add index for question order
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON public.quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON public.exam_questions(exam_id, order_index);
