-- ============================================
-- FIX AMBIGUOUS COLUMN REFERENCE IN AUTO-GRADE FUNCTIONS
-- The variable name "total_points" conflicts with the column name in UPDATE statements
-- Solution: Rename variables to avoid conflicts
-- ============================================

-- Fix auto_grade_quiz_submission function
CREATE OR REPLACE FUNCTION public.auto_grade_quiz_submission(submission_uuid UUID)
RETURNS VOID AS $$
DECLARE
  calculated_score INTEGER := 0;
  calculated_total_points INTEGER := 0;
  quiz_uuid UUID;
BEGIN
  -- Get quiz_id from submission
  SELECT quiz_id INTO quiz_uuid
  FROM public.quiz_submissions
  WHERE id = submission_uuid;
  
  -- Calculate total points
  SELECT COALESCE(SUM(points), 0) INTO calculated_total_points
  FROM public.quiz_questions
  WHERE quiz_id = quiz_uuid;
  
  -- Calculate score from answers
  SELECT COALESCE(SUM(points_earned), 0) INTO calculated_score
  FROM public.quiz_answers
  WHERE submission_id = submission_uuid;
  
  -- Update submission (use renamed variables to avoid ambiguity)
  UPDATE public.quiz_submissions qs
  SET 
    score = calculated_score,
    total_points = calculated_total_points,
    is_completed = true,
    submitted_at = NOW()
  WHERE qs.id = submission_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix auto_grade_exam_submission function
CREATE OR REPLACE FUNCTION public.auto_grade_exam_submission(submission_uuid UUID)
RETURNS VOID AS $$
DECLARE
  calculated_score INTEGER := 0;
  calculated_total_points INTEGER := 0;
  exam_uuid UUID;
BEGIN
  -- Get exam_id from submission
  SELECT exam_id INTO exam_uuid
  FROM public.exam_submissions
  WHERE id = submission_uuid;
  
  -- Calculate total points
  SELECT COALESCE(SUM(points), 0) INTO calculated_total_points
  FROM public.exam_questions
  WHERE exam_id = exam_uuid;
  
  -- Calculate score from answers
  SELECT COALESCE(SUM(points_earned), 0) INTO calculated_score
  FROM public.exam_answers
  WHERE submission_id = submission_uuid;
  
  -- Update submission (use renamed variables to avoid ambiguity)
  UPDATE public.exam_submissions es
  SET 
    score = calculated_score,
    total_points = calculated_total_points,
    is_completed = true,
    submitted_at = NOW()
  WHERE es.id = submission_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
