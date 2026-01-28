"use server"

import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"

export async function toggleCoursePublish(courseId: string, isPublished: boolean) {
  const profile = await requireRole("teacher")
  const supabase = await createClient()

  // Verify teacher owns this course
  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      classroom:classrooms!inner (
        teacher_id
      )
    `)
    .eq("id", courseId)
    .single()

  if (!course || (course.classroom as any).teacher_id !== profile.id) {
    return {
      success: false,
      error: "Unauthorized",
    }
  }

  const { error } = await supabase
    .from("courses")
    .update({ is_published: !isPublished })
    .eq("id", courseId)

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

export async function deleteCourse(courseId: string) {
  const profile = await requireRole("teacher")
  const supabase = await createClient()

  // Verify teacher owns this course
  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      classroom:classrooms!inner (
        teacher_id
      )
    `)
    .eq("id", courseId)
    .single()

  if (!course || (course.classroom as any).teacher_id !== profile.id) {
    return {
      success: false,
      error: "Unauthorized",
    }
  }

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)

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
