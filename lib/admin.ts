/**
 * Admin Functions
 * Helper functions for admin operations using Supabase Admin API
 */

import { createClient } from '@supabase/supabase-js'

// This should use the service role key (server-side only!)
// Never expose this in client-side code
export function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Admin creates a teacher account
 * Creates auth user, profile, and classroom
 * Uses the password provided by admin
 */
export async function adminCreateTeacher(
  email: string,
  password: string,
  fullName: string,
  classroomName: string = 'My Classroom',
  classroomDescription: string = '',
  maxStudents: number = 10,
  classroomSubject: string = ''
) {
  const adminClient = getAdminClient()

  try {
    // 1. Create auth user with admin-provided password
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'teacher'
      }
    })

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user returned')
    }

    const userId = authData.user.id

    // 2. Create profile and classroom using database function (no course creation)
    const { data: setupData, error: setupError } = await adminClient.rpc('admin_setup_teacher', {
      teacher_user_id: userId,
      teacher_full_name: fullName,
      classroom_name: classroomName,
      classroom_description: classroomDescription,
      max_students: maxStudents,
      classroom_subject: classroomSubject || null
    })

    if (setupError) {
      // Cleanup: delete the auth user if profile/classroom creation fails
      await adminClient.auth.admin.deleteUser(userId)
      throw new Error(`Failed to set up teacher profile: ${setupError.message}`)
    }

    return {
      success: true,
      userId,
      courseId: setupData?.course_id ?? setupData?.classroom_id,
      message: 'Teacher account created successfully. They can log in with the provided credentials.'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Admin removes a student from a course
 */
export async function adminRemoveStudent(studentId: string, courseId: string) {
  const adminClient = getAdminClient()

  const { data, error } = await adminClient.rpc('admin_remove_student', {
    student_id_param: studentId,
    classroom_id_param: courseId
  })

  if (error) {
    throw new Error(`Failed to remove student: ${error.message}`)
  }

  return data
}

/**
 * Admin completely removes a student account (deletes profile and auth user).
 * Adds email to blocklist so the same email cannot sign up again.
 */
export async function adminRemoveStudentAccount(studentId: string) {
  const adminClient = getAdminClient()

  // Get email before deletion so we can block it from future signups
  const { data: userData } = await adminClient.auth.admin.getUserById(studentId)
  const email = userData?.user?.email
  if (email) {
    await adminClient
      .from("removed_student_emails")
      .upsert({ email, removed_at: new Date().toISOString() }, { onConflict: "email" })
  }

  // Delete the auth user (cascades to profile and enrollments etc.)
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(studentId)

  if (deleteError) {
    throw new Error(`Failed to delete student account: ${deleteError.message}`)
  }

  return { success: true }
}

/**
 * Admin removes a teacher (and their classroom)
 */
export async function adminRemoveTeacher(teacherId: string) {
  const adminClient = getAdminClient()

  const { data, error } = await adminClient.rpc('admin_remove_teacher', {
    teacher_id_param: teacherId
  })

  if (error) {
    throw new Error(`Failed to remove teacher: ${error.message}`)
  }

  // Also delete the auth user
  await adminClient.auth.admin.deleteUser(teacherId)

  return data
}

/**
 * Admin manually enrolls a student in a course
 */
export async function adminEnrollStudent(studentId: string, courseId: string) {
  const adminClient = getAdminClient()

  const { data, error } = await adminClient.rpc('admin_enroll_student', {
    student_id_param: studentId,
    classroom_id_param: courseId
  })

  if (error) {
    throw new Error(`Failed to enroll student: ${error.message}`)
  }

  return data
}
