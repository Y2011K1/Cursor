CREATE TABLE IF NOT EXISTS teacher_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  qualifications TEXT[],
  specializations TEXT[],
  teaching_philosophy TEXT,
  profile_picture_url TEXT,
  years_experience INTEGER,
  rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  linkedin_url TEXT,
  twitter_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher profiles are viewable by everyone"
  ON teacher_profiles FOR SELECT
  USING (true);

CREATE POLICY "Teachers can update own profile"
  ON teacher_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can insert own profile"
  ON teacher_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user ON teacher_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_featured ON teacher_profiles(featured) WHERE featured = true;

DROP TRIGGER IF EXISTS update_teacher_profiles_updated_at ON teacher_profiles;
CREATE TRIGGER update_teacher_profiles_updated_at
  BEFORE UPDATE ON teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
