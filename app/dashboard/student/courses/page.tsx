import { redirect } from "next/navigation"

export default async function StudentCoursesPage() {
  // Redirect to browse classrooms since courses no longer exist
  redirect("/dashboard/student/browse-courses")
}
