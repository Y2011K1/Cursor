-- ============================================
-- Performance Optimization Indexes
-- Add indexes to improve query performance
-- ============================================

-- Index for lesson_progress lookups
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_lesson 
  ON public.lesson_progress(student_id, lesson_id, is_completed) 
  WHERE is_completed = true;

-- Index for quiz_submissions lookups
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student_quiz 
  ON public.quiz_submissions(student_id, quiz_id, is_completed) 
  WHERE is_completed = true;

-- Index for exam_submissions lookups
CREATE INDEX IF NOT EXISTS idx_exam_submissions_student_exam 
  ON public.exam_submissions(student_id, exam_id, is_completed) 
  WHERE is_completed = true;

-- Index for material_access lookups
CREATE INDEX IF NOT EXISTS idx_material_access_student_material 
  ON public.material_access(student_id, material_id);

-- Index for enrollments lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_student_classroom_active 
  ON public.enrollments(student_id, classroom_id, is_active) 
  WHERE is_active = true;

-- Index for classrooms teacher lookup
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_active 
  ON public.classrooms(teacher_id, is_active) 
  WHERE is_active = true;

-- Composite index for content queries
CREATE INDEX IF NOT EXISTS idx_lessons_classroom_published 
  ON public.lessons(classroom_id, is_published) 
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_quizzes_classroom_published 
  ON public.quizzes(classroom_id, is_published) 
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_exams_classroom_published 
  ON public.exams(classroom_id, is_published) 
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_course_materials_classroom_published 
  ON public.course_materials(classroom_id, is_published) 
  WHERE is_published = true;
