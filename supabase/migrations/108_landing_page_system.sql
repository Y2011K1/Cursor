-- ============================================
-- LANDING PAGE SYSTEM
-- about_section, testimonials, platform_stats
-- ============================================

-- Single-row about section (vision, mission, stats display)
CREATE TABLE IF NOT EXISTS about_section (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  heading TEXT DEFAULT 'About EduPlatform',
  subheading TEXT,
  vision TEXT,
  mission TEXT,
  content TEXT,
  image_url TEXT,
  stat_students INTEGER DEFAULT 0,
  stat_courses INTEGER DEFAULT 0,
  stat_teachers INTEGER DEFAULT 0,
  stat_rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials (featured student reviews)
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_name TEXT NOT NULL,
  student_role_or_course TEXT,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  quote TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform stats (auto-updated or manual)
CREATE TABLE IF NOT EXISTS platform_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_key VARCHAR(100) UNIQUE NOT NULL,
  stat_value TEXT NOT NULL,
  stat_label TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE about_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "About section readable by all"
  ON about_section FOR SELECT USING (true);

CREATE POLICY "Testimonials active readable by all"
  ON testimonials FOR SELECT USING (is_active = true);

CREATE POLICY "Platform stats readable by all"
  ON platform_stats FOR SELECT USING (true);

CREATE POLICY "Admin manages about_section"
  ON about_section FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin manages testimonials"
  ON testimonials FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin manages platform_stats"
  ON platform_stats FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Triggers
DROP TRIGGER IF EXISTS update_about_section_updated_at ON about_section;
CREATE TRIGGER update_about_section_updated_at
  BEFORE UPDATE ON about_section
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_stats_updated_at ON platform_stats;
CREATE TRIGGER update_platform_stats_updated_at
  BEFORE UPDATE ON platform_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function: refresh platform stats from live data (for about_section and/or platform_stats)
CREATE OR REPLACE FUNCTION refresh_platform_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_students BIGINT;
  v_courses BIGINT;
  v_teachers BIGINT;
  v_rating DECIMAL(3,2);
BEGIN
  SELECT COUNT(*) INTO v_students FROM profiles WHERE role = 'student';
  SELECT COUNT(*) INTO v_courses FROM courses WHERE is_active = true;
  SELECT COUNT(*) INTO v_teachers FROM profiles WHERE role = 'teacher';
  SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0) INTO v_rating FROM teacher_profiles WHERE total_ratings > 0;

  UPDATE about_section
  SET stat_students = v_students::INTEGER, stat_courses = v_courses::INTEGER,
      stat_teachers = v_teachers::INTEGER, stat_rating = v_rating, updated_at = NOW()
  WHERE id = (SELECT id FROM about_section LIMIT 1);

  IF NOT FOUND THEN
    INSERT INTO about_section (heading, subheading, stat_students, stat_courses, stat_teachers, stat_rating)
    VALUES ('About EduPlatform', 'Your journey to excellence starts here',
            v_students::INTEGER, v_courses::INTEGER, v_teachers::INTEGER, v_rating);
  END IF;

  INSERT INTO platform_stats (stat_key, stat_value, stat_label, display_order)
  VALUES
    ('students', v_students::TEXT, 'Active Students', 1),
    ('courses', v_courses::TEXT, 'Courses', 2),
    ('teachers', v_teachers::TEXT, 'Expert Instructors', 3),
    ('rating', v_rating::TEXT, 'Student Rating', 4)
  ON CONFLICT (stat_key) DO UPDATE
  SET stat_value = EXCLUDED.stat_value, updated_at = NOW();
END;
$$;

-- Seed one about_section row and initial platform_stats (run refresh after)
INSERT INTO about_section (heading, subheading, vision, mission, content)
SELECT 'About EduPlatform', 'Your journey to excellence starts here',
  'To make quality education accessible to everyone.',
  'We connect students with expert instructors through structured, outcome-focused courses.',
  'We are a modern learning platform built to connect students with expert instructors and structured, outcome-focused courses.'
WHERE NOT EXISTS (SELECT 1 FROM about_section LIMIT 1);
