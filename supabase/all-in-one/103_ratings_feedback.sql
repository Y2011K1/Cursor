CREATE TABLE IF NOT EXISTS course_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  content_quality INTEGER CHECK (content_quality >= 1 AND content_quality <= 5),
  difficulty_accuracy INTEGER CHECK (difficulty_accuracy >= 1 AND difficulty_accuracy <= 5),
  usefulness INTEGER CHECK (usefulness >= 1 AND usefulness <= 5),
  written_feedback TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

CREATE TABLE IF NOT EXISTS teacher_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  teaching_clarity INTEGER CHECK (teaching_clarity >= 1 AND teaching_clarity <= 5),
  engagement INTEGER CHECK (engagement >= 1 AND engagement <= 5),
  supportiveness INTEGER CHECK (supportiveness >= 1 AND supportiveness <= 5),
  written_feedback TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, student_id, course_id)
);

ALTER TABLE course_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can create course ratings" ON course_ratings;
CREATE POLICY "Students can create course ratings"
  ON course_ratings FOR INSERT
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can create teacher ratings" ON teacher_ratings;
CREATE POLICY "Students can create teacher ratings"
  ON teacher_ratings FOR INSERT
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Approved course ratings viewable by all" ON course_ratings;
CREATE POLICY "Approved course ratings viewable by all"
  ON course_ratings FOR SELECT
  USING (is_approved = true);

DROP POLICY IF EXISTS "Approved teacher ratings viewable by all" ON teacher_ratings;
CREATE POLICY "Approved teacher ratings viewable by all"
  ON teacher_ratings FOR SELECT
  USING (is_approved = true);

DROP POLICY IF EXISTS "Admin can update course ratings" ON course_ratings;
CREATE POLICY "Admin can update course ratings"
  ON course_ratings FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admin can update teacher ratings" ON teacher_ratings;
CREATE POLICY "Admin can update teacher ratings"
  ON teacher_ratings FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE OR REPLACE FUNCTION update_course_rating_agg()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses
  SET 
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM course_ratings
      WHERE course_id = NEW.course_id AND is_approved = true
    ), 0),
    total_ratings = (
      SELECT COUNT(*)
      FROM course_ratings
      WHERE course_id = NEW.course_id AND is_approved = true
    )
  WHERE id = NEW.course_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS course_rating_trigger ON course_ratings;
CREATE TRIGGER course_rating_trigger
AFTER INSERT OR UPDATE ON course_ratings
FOR EACH ROW
EXECUTE FUNCTION update_course_rating_agg();

CREATE OR REPLACE FUNCTION update_teacher_rating_agg()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE teacher_profiles
  SET 
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM teacher_ratings
      WHERE teacher_id = NEW.teacher_id AND is_approved = true
    ), 0),
    total_ratings = (
      SELECT COUNT(*)
      FROM teacher_ratings
      WHERE teacher_id = NEW.teacher_id AND is_approved = true
    )
  WHERE user_id = NEW.teacher_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS teacher_rating_trigger ON teacher_ratings;
CREATE TRIGGER teacher_rating_trigger
AFTER INSERT OR UPDATE ON teacher_ratings
FOR EACH ROW
EXECUTE FUNCTION update_teacher_rating_agg();
