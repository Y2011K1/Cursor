import { redirect } from "next/navigation"

interface CoursePageProps {
  params: Promise<{ courseId: string }>
}

export default async function StudentCoursePage({ params }: CoursePageProps) {
  const { courseId } = await params
  // courseId is actually classroomId (for backward compatibility with routes)
  redirect(`/dashboard/student/classroom/${courseId}`)
}
