import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function TeacherCoursesPage() {
  const profile = await requireRole("teacher")
  const supabase = await createClient()

  // Get teacher's classroom
  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id")
    .eq("teacher_id", profile.id)
    .single()

  if (!classroom) {
    redirect("/dashboard/teacher")
  }

  // Redirect directly to classroom content page
  redirect(`/dashboard/teacher/classroom/${classroom.id}`)
}
