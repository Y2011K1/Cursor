-- ============================================
-- Add Due Dates to Exams
-- ============================================

-- Add due_date column to exams table
ALTER TABLE public.exams
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Add index for due_date queries
CREATE INDEX IF NOT EXISTS idx_exams_due_date ON public.exams(due_date) WHERE due_date IS NOT NULL;
