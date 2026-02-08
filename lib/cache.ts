import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getCachedEnrollments = cache(async (studentId: string) => {
  const supabase = await createClient()
  return supabase
    .from("enrollments")
    .select(`
      *,
      course:courses!inner (
        id,
        name,
        subject,
        is_active
      )
    `)
    .eq("student_id", studentId)
    .eq("is_active", true)
})

export const getCachedCourse = cache(async (courseId: string) => {
  const supabase = await createClient()
  return supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single()
})

export const getCachedProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  return supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
})

export const getCachedTeacherCourse = cache(async (teacherId: string) => {
  const supabase = await createClient()
  return supabase
    .from("courses")
    .select("*")
    .eq("teacher_id", teacherId)
    .eq("is_active", true)
    .single()
})

// Backward-compatible aliases (prefer getCachedCourse / getCachedTeacherCourse)
export const getCachedClassroom = getCachedCourse
export const getCachedTeacherClassroom = getCachedTeacherCourse
