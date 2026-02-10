-- Allow admins to SELECT all testimonials (including inactive) so they can approve, reorder, and remove.
-- Without this, only "Testimonials active readable by all" (is_active = true) exists, so admins could not see inactive rows.

DROP POLICY IF EXISTS "Admin can select all testimonials" ON testimonials;
CREATE POLICY "Admin can select all testimonials"
  ON testimonials FOR SELECT
  USING (public.is_admin());
