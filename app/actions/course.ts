"use server"

import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"
import { revalidatePath } from "next/cache"

/** Student leaves a course (sets enrollment is_active = false). */
export async function leaveCourse(courseId: string) {
  const profile = await requireRole("student")
  const supabase = await createClient()

  const { error } = await supabase
    .from("enrollments")
    .update({ is_active: false })
    .eq("student_id", profile.id)
    .eq("course_id", courseId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/student")
  revalidatePath("/dashboard/student/browse-courses")
  return { error: null }
}

export async function toggleCoursePublish(courseId: string, isPublished: boolean) {
  const profile = await requireRole("teacher")
  const supabase = await createClient()

  const { data: course } = await supabase
    .from("courses")
    .select("id, teacher_id")
    .eq("id", courseId)
    .single()

  if (!course || course.teacher_id !== profile.id) {
    return {
      success: false,
      error: "Unauthorized",
    }
  }

  const { error } = await supabase
    .from("courses")
    .update({ is_active: !isPublished })
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

  const { data: course } = await supabase
    .from("courses")
    .select("id, teacher_id")
    .eq("id", courseId)
    .single()

  if (!course || course.teacher_id !== profile.id) {
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
