"use server"

import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"

export async function toggleQuizPublish(quizId: string, isPublished: boolean) {
  const profile = await requireRole("teacher")
  const supabase = await createClient()

  // Verify teacher owns this quiz
  const { data: quiz } = await supabase
    .from("quizzes")
    .select(`
      *,
      course:courses!inner (
        teacher_id
      )
    `)
    .eq("id", quizId)
    .single()

  if (!quiz || (quiz.course as any).teacher_id !== profile.id) {
    return {
      success: false,
      error: "Unauthorized",
    }
  }

  const { error } = await supabase
    .from("quizzes")
    .update({ is_published: !isPublished })
    .eq("id", quizId)

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
  }
}

export async function deleteQuiz(quizId: string) {
  const profile = await requireRole("teacher")
  const supabase = await createClient()

  // Verify teacher owns this quiz
  const { data: quiz } = await supabase
    .from("quizzes")
    .select(`
      *,
      course:courses!inner (
        teacher_id
      )
    `)
    .eq("id", quizId)
    .single()

  if (!quiz || (quiz.course as any).teacher_id !== profile.id) {
    return {
      success: false,
      error: "Unauthorized",
    }
  }

  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", quizId)

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
  }
}
