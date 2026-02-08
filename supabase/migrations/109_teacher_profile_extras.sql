-- Add optional fields for teacher profiles (birthdate, education, etc.)
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS certifications TEXT[];
COMMENT ON COLUMN teacher_profiles.profile_picture_url IS 'URL of teacher profile photo, shown to students and on landing';
COMMENT ON COLUMN teacher_profiles.years_experience IS 'Years of teaching experience';
COMMENT ON COLUMN teacher_profiles.birthdate IS 'Optional date of birth';
COMMENT ON COLUMN teacher_profiles.education IS 'Optional education background';
