-- Testimonials: only students can add; admin/teachers cannot.
-- Add student_id to link testimonial to the student who wrote it.
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Drop admin and student policies so this is idempotent (111 duplicates 110; safe to run either order)
DROP POLICY IF EXISTS "Admin manages testimonials" ON testimonials;
DROP POLICY IF EXISTS "Students can insert own testimonial" ON testimonials;
DROP POLICY IF EXISTS "Students can update own testimonial" ON testimonials;
DROP POLICY IF EXISTS "Students can delete own testimonial" ON testimonials;
DROP POLICY IF EXISTS "Admin can update testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admin can delete testimonials" ON testimonials;

-- Everyone can read active testimonials (unchanged)
-- Already: "Testimonials active readable by all"

-- Only students can insert (their own testimonial)
CREATE POLICY "Students can insert own testimonial"
  ON testimonials FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'student'
  );

-- Students can update/delete only their own
CREATE POLICY "Students can update own testimonial"
  ON testimonials FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Students can delete own testimonial"
  ON testimonials FOR DELETE
  USING (auth.uid() = student_id);

-- Admin can update (e.g. is_active, display_order) and delete for moderation; cannot insert
CREATE POLICY "Admin can update testimonials"
  ON testimonials FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can delete testimonials"
  ON testimonials FOR DELETE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Teachers have no testimonials policies (cannot add or manage)
