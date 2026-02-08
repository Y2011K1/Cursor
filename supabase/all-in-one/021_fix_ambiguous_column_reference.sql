-- ============================================
-- FIX AMBIGUOUS COLUMN REFERENCE IN TRIGGER FUNCTIONS
-- The variable name "correct_answer" conflicts with the column name
-- ============================================

-- Fix calculate_exam_answer_score function
CREATE OR REPLACE FUNCTION public.calculate_exam_answer_score()
RETURNS TRIGGER AS $$
DECLARE
  correct_answer_value TEXT;
  question_points INTEGER;
BEGIN
  -- Get correct answer and points
  SELECT eq.correct_answer, eq.points INTO correct_answer_value, question_points
  FROM public.exam_questions eq
  WHERE eq.id = NEW.question_id;
  
  -- Check if answer is correct
  IF NEW.selected_answer = correct_answer_value THEN
    NEW.is_correct := true;
    NEW.points_earned := question_points;
  ELSE
    NEW.is_correct := false;
    NEW.points_earned := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix calculate_quiz_answer_score function (preventive fix)
CREATE OR REPLACE FUNCTION public.calculate_quiz_answer_score()
RETURNS TRIGGER AS $$
DECLARE
  correct_answer_value TEXT;
  question_points INTEGER;
BEGIN
  -- Get correct answer and points
  SELECT qq.correct_answer, qq.points INTO correct_answer_value, question_points
  FROM public.quiz_questions qq
  WHERE qq.id = NEW.question_id;
  
  -- Check if answer is correct
  IF NEW.selected_answer = correct_answer_value THEN
    NEW.is_correct := true;
    NEW.points_earned := question_points;
  ELSE
    NEW.is_correct := false;
    NEW.points_earned := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
