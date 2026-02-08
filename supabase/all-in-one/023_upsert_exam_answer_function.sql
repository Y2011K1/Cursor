-- ============================================
-- CREATE FUNCTION TO HANDLE EXAM ANSWER UPSERT
-- This function properly handles the unique constraint (submission_id, question_id)
-- ============================================

CREATE OR REPLACE FUNCTION public.upsert_exam_answer(
  p_submission_id UUID,
  p_question_id UUID,
  p_selected_answer TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.exam_answers (submission_id, question_id, selected_answer)
  VALUES (p_submission_id, p_question_id, p_selected_answer)
  ON CONFLICT (submission_id, question_id)
  DO UPDATE SET
    selected_answer = EXCLUDED.selected_answer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE FUNCTION TO HANDLE QUIZ ANSWER UPSERT
-- This function properly handles the unique constraint (submission_id, question_id)
-- ============================================

CREATE OR REPLACE FUNCTION public.upsert_quiz_answer(
  p_submission_id UUID,
  p_question_id UUID,
  p_selected_answer TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.quiz_answers (submission_id, question_id, selected_answer)
  VALUES (p_submission_id, p_question_id, p_selected_answer)
  ON CONFLICT (submission_id, question_id)
  DO UPDATE SET
    selected_answer = EXCLUDED.selected_answer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
