-- ============================================
-- Landing page & dashboard performance indexes
-- Run after 100 (classrooms -> courses). Safe to run multiple times.
-- ============================================

-- Profiles: role lookup (middleware + dashboard redirect)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Courses: landing page "active, order by rating"
CREATE INDEX IF NOT EXISTS idx_courses_active_rating
  ON public.courses(is_active, rating DESC NULLS LAST)
  WHERE is_active = true;

-- Blog: landing "published, order by published_at"
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON public.blog_posts(status, published_at DESC NULLS LAST)
  WHERE status = 'published';

-- Testimonials: landing "active, order by display_order"
CREATE INDEX IF NOT EXISTS idx_testimonials_active_order
  ON public.testimonials(is_active, display_order)
  WHERE is_active = true;

-- Platform stats: landing order
CREATE INDEX IF NOT EXISTS idx_platform_stats_order
  ON public.platform_stats(display_order);

-- Enrollments: student + course (dashboard, course pages)
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course_active
  ON public.enrollments(student_id, course_id, is_active)
  WHERE is_active = true;

-- Course materials: published by course (post-100 schema uses course_id)
DROP INDEX IF EXISTS idx_materials_classroom_published;
CREATE INDEX IF NOT EXISTS idx_course_materials_course_published
  ON public.course_materials(course_id, is_published)
  WHERE is_published = true;
