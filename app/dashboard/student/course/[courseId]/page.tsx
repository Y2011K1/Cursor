import { redirect } from "next/navigation"

interface CoursePageProps {
  params: Promise<{ courseId: string }>
}

export default async function StudentCoursePage({ params }: CoursePageProps) {
  const { courseId } = await params
  redirect(`/dashboard/student/course/${courseId}/lessons`)
}
