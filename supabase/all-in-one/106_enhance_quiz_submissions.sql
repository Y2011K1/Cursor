ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS teacher_feedback TEXT;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES profiles(id);
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS submission_file_url TEXT;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS pass_fail_status VARCHAR(10) CHECK (pass_fail_status IN ('pass', 'fail'));
