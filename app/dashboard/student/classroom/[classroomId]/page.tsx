import { redirect, notFound } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { BookOpen, FileText, Clock, PlayCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface ClassroomPageProps {
  params: Promise<{ classroomId: string }>
}

export default async function ClassroomPage({ params }: ClassroomPageProps) {
  const { classroomId } = await params
  const profile = await requireRole("student")
  const supabase = await createClient()

  // Verify student is enrolled in this classroom
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select(`
      *,
      course:courses (
        id,
        name,
        description,
        teacher:profiles!courses_teacher_id_fkey (
          id,
          full_name
        )
      )
    `)
    .eq("student_id", profile.id)
    .eq("course_id", classroomId)
    .eq("is_active", true)
    .single()

  if (!enrollment) {
    notFound()
  }

  const classroom = enrollment.course as any

  // Get all data in parallel for better performance
  const [lessonsResult, quizzesResult, examsResult] = await Promise.all([
    supabase
      .from("lessons")
      .select("*")
      .eq("course_id", classroomId)
      .eq("is_published", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("quizzes")
      .select("*")
      .eq("course_id", classroomId)
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("exams")
      .select("*")
      .eq("course_id", classroomId)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
  ])

  const lessons = lessonsResult.data
  const quizzes = quizzesResult.data
  const exams = examsResult.data

  // Get lesson progress (only if there are lessons)
  const lessonIds = lessons?.map((l) => l.id) || []
  const { data: progress } = lessonIds.length > 0
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id, is_completed")
        .eq("student_id", profile.id)
        .in("lesson_id", lessonIds)
    : { data: null }

  const progressMap = new Map<string, boolean>()
  progress?.forEach((p) => {
    progressMap.set(p.lesson_id, p.is_completed)
  })

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-deep-teal mb-2">
                  {classroom.name}
                </h1>
                <div className="space-y-1">
                  {classroom.subject && (
                    <p className="text-lg text-slate-blue font-medium">
                      Subject: {classroom.subject}
                    </p>
                  )}
                  <p className="text-slate-blue">
                    Teacher: {classroom.teacher?.full_name || "Unknown"}
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href="/dashboard/student">Back to Dashboard</Link>
              </Button>
            </div>
            {classroom.description && (
              <p className="text-slate-blue mt-2">{classroom.description}</p>
            )}
          </div>

          <div className="space-y-6">
            {/* Lessons Section */}
            {lessons && lessons.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-deep-teal mb-4">
                  Lessons
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lessons.map((lesson, index) => {
                    const isCompleted = progressMap.get(lesson.id) || false
                    return (
                      <Card
                        key={lesson.id}
                        className="border-0 shadow-md hover:shadow-lg transition-shadow"
                      >
                        <CardHeader>
                          <CardTitle className="text-deep-teal flex items-center gap-2">
                            <PlayCircle className="h-4 w-4" />
                            Lesson {index + 1}: {lesson.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {lesson.content && (
                            <p className="text-sm text-slate-blue line-clamp-2">
                              {lesson.content}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            {isCompleted ? (
                              <span className="text-xs text-success-green flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Completed
                              </span>
                            ) : (
                              <span className="text-xs text-slate-blue">Not started</span>
                            )}
                            <Button size="sm" asChild>
                              <Link href={`/dashboard/student/course/${classroomId}/lesson/${lesson.id}`}>
                                View Lesson
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quizzes Section */}
            {quizzes && quizzes.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-deep-teal mb-4">
                  Quizzes (Assignments)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quizzes.map((quiz) => (
                    <Card
                      key={quiz.id}
                      className="border-0 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <CardTitle className="text-deep-teal flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {quiz.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {quiz.description && (
                          <p className="text-sm text-slate-blue line-clamp-2">
                            {quiz.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-blue">
                          {quiz.time_limit_minutes && (
                            <span>⏱️ {quiz.time_limit_minutes} min</span>
                          )}
                          <span>Max attempts: {quiz.max_attempts}</span>
                        </div>
                        <Button size="sm" className="w-full" asChild>
                          <Link href={`/dashboard/student/course/${classroomId}/quiz/${quiz.id}`}>
                            Take Quiz
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Exams Section */}
            {exams && exams.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-deep-teal mb-4">
                  Exams
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exams.map((exam) => (
                    <Card
                      key={exam.id}
                      className="border-0 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <CardTitle className="text-deep-teal flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {exam.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {exam.description && (
                          <p className="text-sm text-slate-blue line-clamp-2">
                            {exam.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-blue">
                          <span>⏱️ {exam.time_limit_minutes} min</span>
                          <span>One attempt only</span>
                          {exam.due_date && (
                            <span>📅 Due: {new Date(exam.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                        <Button size="sm" className="w-full" asChild>
                          <Link href={`/dashboard/student/course/${classroomId}/exam/${exam.id}`}>
                            Take Exam
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!lessons || lessons.length === 0) && (!quizzes || quizzes.length === 0) && (!exams || exams.length === 0) && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-deep-teal">No Content Available</CardTitle>
                  <CardDescription>
                    This classroom doesn&apos;t have any published content yet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-blue">
                    Check back later or contact your teacher for more information.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
