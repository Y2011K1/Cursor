import { redirect } from "next/navigation"

/** Single browse experience: redirect to browse-courses. */
export default function StudentBrowsePage() {
  redirect("/dashboard/student/browse-courses")
}
