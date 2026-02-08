-- ============================================
-- FIX RLS POLICIES
-- All "Admin manages" FOR ALL policies need WITH CHECK for INSERT/UPDATE to work.
-- Use public.is_admin() for consistent, reliable checks (SECURITY DEFINER from 002).
-- ============================================

-- Ensure helper exists (idempotent)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

-- ----- blog_posts (104) -----
DROP POLICY IF EXISTS "Admin can manage blog posts" ON blog_posts;
CREATE POLICY "Admin can manage blog posts"
  ON blog_posts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----- blog_categories (104): allow admin to manage -----
DROP POLICY IF EXISTS "Admin can manage blog_categories" ON blog_categories;
CREATE POLICY "Admin can manage blog_categories"
  ON blog_categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----- announcements (105) -----
DROP POLICY IF EXISTS "Admin manages announcements" ON announcements;
CREATE POLICY "Admin manages announcements"
  ON announcements FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----- homepage_slides (105) -----
DROP POLICY IF EXISTS "Admin manages slides" ON homepage_slides;
CREATE POLICY "Admin manages slides"
  ON homepage_slides FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----- about_section (108) -----
DROP POLICY IF EXISTS "Admin manages about_section" ON about_section;
CREATE POLICY "Admin manages about_section"
  ON about_section FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----- testimonials (108 then 110/111) -----
DROP POLICY IF EXISTS "Admin manages testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admin can update testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admin can delete testimonials" ON testimonials;
CREATE POLICY "Admin can update testimonials"
  ON testimonials FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Admin can delete testimonials"
  ON testimonials FOR DELETE
  USING (public.is_admin());

-- ----- platform_stats (108) -----
DROP POLICY IF EXISTS "Admin manages platform_stats" ON platform_stats;
CREATE POLICY "Admin manages platform_stats"
  ON platform_stats FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----- certificates (107) -----
DROP POLICY IF EXISTS "Admin can manage certificates" ON certificates;
CREATE POLICY "Admin can manage certificates"
  ON certificates FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----- course_ratings (103) -----
DROP POLICY IF EXISTS "Admin can update course ratings" ON course_ratings;
CREATE POLICY "Admin can update course ratings"
  ON course_ratings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----- teacher_ratings (103) -----
DROP POLICY IF EXISTS "Admin can update teacher ratings" ON teacher_ratings;
CREATE POLICY "Admin can update teacher ratings"
  ON teacher_ratings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----- blog_post_links (112) -----
DROP POLICY IF EXISTS "Admin manages blog post links" ON blog_post_links;
CREATE POLICY "Admin manages blog post links"
  ON blog_post_links FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----- featured_links (111) - if table exists -----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'featured_links') THEN
    DROP POLICY IF EXISTS "Featured links readable by all" ON featured_links;
    DROP POLICY IF EXISTS "Admin manages featured_links" ON featured_links;
    EXECUTE 'CREATE POLICY "Featured links readable by all" ON featured_links FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Admin manages featured_links" ON featured_links FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;
END $$;
