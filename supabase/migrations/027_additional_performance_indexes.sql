-- Add missing indexes for course materials
CREATE INDEX IF NOT EXISTS idx_materials_classroom_published 
ON public.course_materials(classroom_id, is_published) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_material_access_student_material 
ON public.material_access(student_id, material_id);

-- Add composite index for progress queries
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_completed 
ON public.lesson_progress(student_id, is_completed) 
WHERE is_completed = true;

-- Add index for classroom teacher lookup
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_active 
ON public.classrooms(teacher_id, is_active) 
WHERE is_active = true;

-- Add index for profiles full text search (future feature)
CREATE INDEX IF NOT EXISTS idx_profiles_full_name 
ON public.profiles USING gin(to_tsvector('english', full_name));

-- Add index for quiz submissions lookups
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student_completed 
ON public.quiz_submissions(student_id, is_completed) 
WHERE is_completed = true;

-- Add index for exam submissions lookups
CREATE INDEX IF NOT EXISTS idx_exam_submissions_student_completed 
ON public.exam_submissions(student_id, is_completed) 
WHERE is_completed = true;

-- Add index for enrollments active lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_student_active 
ON public.enrollments(student_id, is_active) 
WHERE is_active = true;
