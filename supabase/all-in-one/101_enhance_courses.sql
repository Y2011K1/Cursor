-- Add new columns to courses table for EduPlatform
ALTER TABLE courses ADD COLUMN IF NOT EXISTS specialization VARCHAR(100);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites TEXT[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS estimated_duration_hours INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_year VARCHAR(50);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certification_available BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

CREATE INDEX IF NOT EXISTS idx_courses_specialization ON courses(specialization);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_courses_rating ON courses(rating DESC);
CREATE INDEX IF NOT EXISTS idx_courses_popularity ON courses(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(featured) WHERE featured = true;
