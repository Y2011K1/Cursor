-- ============================================
-- Allow Students to Browse Active Classrooms
-- ============================================
-- This migration adds a policy to allow students to view
-- all active classrooms for browsing/enrollment purposes
-- ============================================

-- Students can view active classrooms for browsing (even if not enrolled)
CREATE POLICY "Students can browse active classrooms"
  ON public.classrooms FOR SELECT
  USING (
    is_active = true AND
    public.is_student()
  );
