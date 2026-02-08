CREATE SEQUENCE IF NOT EXISTS certificate_seq START 1;

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number VARCHAR(50) UNIQUE,
  issued_date DATE DEFAULT CURRENT_DATE,
  completion_date DATE,
  final_score DECIMAL(5,2),
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'EDUPLATFORM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('certificate_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own certificates"
  ON certificates FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Public can view certificates for verification"
  ON certificates FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage certificates"
  ON certificates FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
