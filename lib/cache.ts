import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getCachedEnrollments = cache(async (studentId: string) => {
  const supabase = await createClient()
  return supabase
    .from("enrollments")
    .select(`
      *,
      classroom:classrooms!inner (
        id,
        name,
        subject,
        is_active
      )
    `)
    .eq("student_id", studentId)
    .eq("is_active", true)
})

export const getCachedClassroom = cache(async (classroomId: string) => {
  const supabase = await createClient()
  return supabase
    .from("classrooms")
    .select("*")
    .eq("id", classroomId)
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

export const getCachedTeacherClassroom = cache(async (teacherId: string) => {
  const supabase = await createClient()
  return supabase
    .from("classrooms")
    .select("*")
    .eq("teacher_id", teacherId)
    .eq("is_active", true)
    .single()
})
