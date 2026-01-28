"use server"

import { adminCreateTeacher, adminRemoveTeacher, adminRemoveStudentAccount } from "@/lib/admin"
import { requireRole } from "@/lib/auth"

export async function createTeacher(formData: FormData) {
  // Verify admin role
  await requireRole("admin")

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const classroomName = formData.get("classroomName") as string
  const classroomDescription = formData.get("classroomDescription") as string
  const maxStudents = parseInt(formData.get("maxStudents") as string) || 10
  const classroomSubject = formData.get("classroomSubject") as string || ""

  if (!email || !password || !fullName || !classroomName) {
    return {
      success: false,
      error: "All required fields must be filled",
    }
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters",
    }
  }

  try {
    const result = await adminCreateTeacher(
      email,
      password,
      fullName,
      classroomName,
      classroomDescription || "",
      maxStudents,
      classroomSubject
    )

    return result
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create teacher",
    }
  }
}

export async function removeTeacher(teacherId: string) {
  // Verify admin role
  await requireRole("admin")

  if (!teacherId) {
    return {
      success: false,
      error: "Teacher ID is required",
    }
  }

  try {
    await adminRemoveTeacher(teacherId)
    return {
      success: true,
      message: "Teacher removed successfully",
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to remove teacher",
    }
  }
}

export async function removeStudent(studentId: string) {
  // Verify admin role
  await requireRole("admin")

  if (!studentId) {
    return {
      success: false,
      error: "Student ID is required",
    }
  }

  try {
    await adminRemoveStudentAccount(studentId)
    return {
      success: true,
      message: "Student removed successfully",
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to remove student",
    }
  }
}
