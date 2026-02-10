-- ============================================
-- Add Public Access Policies for Landing Page
-- ============================================
-- This allows unauthenticated users to view courses and teacher profiles
-- for the public landing page

-- Public can view active courses
DROP POLICY IF EXISTS "Public can view active courses" ON public.courses;
CREATE POLICY "Public can view active courses"
  ON public.courses FOR SELECT
  USING (is_active = true);

-- Public can view teacher profiles (for landing page)
DROP POLICY IF EXISTS "Public can view teacher profiles" ON public.profiles;
CREATE POLICY "Public can view teacher profiles"
  ON public.profiles FOR SELECT
  USING (role = 'teacher');

-- Public can view teacher_profiles
DROP POLICY IF EXISTS "Public can view teacher_profiles" ON public.teacher_profiles;
CREATE POLICY "Public can view teacher_profiles"
  ON public.teacher_profiles FOR SELECT
  USING (true);
