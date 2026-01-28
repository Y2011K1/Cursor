"use server"

import { revalidatePath } from "next/cache"

export async function revalidateDashboards() {
  // Revalidate admin dashboard
  revalidatePath("/dashboard/admin")
  
  // Revalidate student dashboard and all student pages
  revalidatePath("/dashboard/student")
  revalidatePath("/dashboard/student/video-lectures")
  revalidatePath("/dashboard/student/course-materials")
  revalidatePath("/dashboard/student/exams")
  revalidatePath("/dashboard/student/assignments")
  
  return { success: true }
}
