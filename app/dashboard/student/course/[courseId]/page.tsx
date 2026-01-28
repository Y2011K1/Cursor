import { redirect } from "next/navigation"

interface CoursePageProps {
  params: {
    courseId: string
  }
}

export default async function StudentCoursePage({ params }: CoursePageProps) {
  // Note: courseId parameter is now actually classroomId (for backward compatibility with routes)
  // Redirect to the classroom page instead - this page should not be accessible
  redirect(`/dashboard/student/classroom/${params.courseId}`)
}
