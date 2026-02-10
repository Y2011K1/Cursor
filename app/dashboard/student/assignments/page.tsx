import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

/** Redirect to first classroom so all content is in one place. */
export const dynamic = "force-dynamic"

export default async function AssignmentsPage() {
  const profile = await requireRole("student")
  const supabase = await createClient()
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", profile.id)
    .eq("is_active", true)
    .limit(1)
  const first = enrollments?.[0]?.course_id
  if (first) redirect(`/dashboard/student/classroom/${first}`)
  redirect("/dashboard/student")
}
