import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { FileText, Clock, PlayCircle, CheckCircle2, File } from "lucide-react"
import Link from "next/link"
import { LeaveCourseButton } from "@/components/leave-course-button"
import { MaterialAccessButton } from "@/components/material-access-button"

interface ClassroomPageProps {
  params: Promise<{ classroomId: string }>
}

export default async function ClassroomPage({ params }: ClassroomPageProps) {
  const { classroomId } = await params
  const profile = await requireRole("student")
  const supabase = await createClient()

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select(`
      *,
      course:courses (
        id,
        name,
        description,
        subject,
        teacher:profiles!classrooms_teacher_id_fkey (
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

  const [lessonsResult, quizzesResult, examsResult, materialsResult] = await Promise.all([
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
      .order("created_at", { ascending: false }),
    supabase
      .from("course_materials")
      .select("*")
      .eq("course_id", classroomId)
      .eq("is_published", true)
      .order("order_index", { ascending: true })
  ])

  const lessons = lessonsResult.data || []
  const quizzes = quizzesResult.data || []
  const exams = examsResult.data || []
  const materials = materialsResult.data || []

  const lessonIds = lessons.map((l) => l.id)
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

  const sectionCardClass = "border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl"
  const emptyCardClass = "border-none shadow-sm rounded-2xl bg-white/80"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header - same for every course */}
          <div className="bg-gradient-to-r from-deep-teal/10 via-soft-mint/10 to-success-green/10 rounded-2xl p-6 border border-deep-teal/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-deep-teal mb-2">
                  {classroom.name}
                </h1>
                {classroom.subject && (
                  <p className="text-slate-blue font-medium">Subject: {classroom.subject}</p>
                )}
                <p className="text-slate-blue text-sm mt-1">
                  Teacher: {classroom.teacher?.full_name ?? "Unknown"}
                </p>
                {classroom.description && (
                  <p className="text-slate-blue mt-2 text-sm">{classroom.description}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/student">Back to Dashboard</Link>
                </Button>
                <LeaveCourseButton courseId={classroomId} courseName={classroom?.name ?? "Course"} />
              </div>
            </div>
          </div>

          {/* 1. Lessons - always show same section layout */}
          <div>
            <h2 className="text-xl font-semibold text-deep-teal mb-4 flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Lessons
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.length > 0 ? (
                lessons.map((lesson: any, index: number) => {
                  const isCompleted = progressMap.get(lesson.id) ?? false
                  return (
                    <Card key={lesson.id} className={sectionCardClass}>
                      <CardHeader>
                        <CardTitle className="text-deep-teal flex items-center gap-2 text-base">
                          Lesson {index + 1}: {lesson.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {lesson.content && (
                          <p className="text-sm text-slate-blue line-clamp-2">{lesson.content}</p>
                        )}
                        <div className="flex items-center justify-between">
                          {isCompleted ? (
                            <span className="text-xs text-success-green flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Completed
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
                })
              ) : (
                <Card className={emptyCardClass}>
                  <CardContent className="py-6 text-center text-slate-blue text-sm">
                    No lessons in this course yet. Check back later.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* 2. Course Materials - always show same section layout */}
          <div>
            <h2 className="text-xl font-semibold text-deep-teal mb-4 flex items-center gap-2">
              <File className="h-5 w-5" />
              Course Materials
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.length > 0 ? (
                materials.map((mat: any) => (
                  <Card key={mat.id} className={sectionCardClass}>
                    <CardHeader>
                      <CardTitle className="text-deep-teal text-base">{mat.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <MaterialAccessButton
                          materialId={mat.id}
                          fileUrl={mat.file_url}
                          fileName={mat.title}
                          fileType={mat.file_type}
                          showView
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className={emptyCardClass}>
                  <CardContent className="py-6 text-center text-slate-blue text-sm">
                    No materials in this course yet. Check back later.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* 3. Quizzes (Assignments) - always show same section layout */}
          <div>
            <h2 className="text-xl font-semibold text-deep-teal mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quizzes (Assignments)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.length > 0 ? (
                quizzes.map((quiz: any) => (
                  <Card key={quiz.id} className={sectionCardClass}>
                    <CardHeader>
                      <CardTitle className="text-deep-teal text-base">{quiz.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {quiz.description && (
                        <p className="text-sm text-slate-blue line-clamp-2">{quiz.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-blue">
                        {quiz.time_limit_minutes && <span>⏱️ {quiz.time_limit_minutes} min</span>}
                        <span>Max attempts: {quiz.max_attempts ?? "—"}</span>
                      </div>
                      <Button size="sm" className="w-full" asChild>
                        <Link href={`/dashboard/student/course/${classroomId}/quiz/${quiz.id}`}>
                          Take Quiz
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className={emptyCardClass}>
                  <CardContent className="py-6 text-center text-slate-blue text-sm">
                    No quizzes in this course yet. Check back later.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* 4. Exams - always show same section layout */}
          <div>
            <h2 className="text-xl font-semibold text-deep-teal mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Exams
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.length > 0 ? (
                exams.map((exam: any) => (
                  <Card key={exam.id} className={sectionCardClass}>
                    <CardHeader>
                      <CardTitle className="text-deep-teal text-base">{exam.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {exam.description && (
                        <p className="text-sm text-slate-blue line-clamp-2">{exam.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-blue">
                        <span>⏱️ {exam.time_limit_minutes ?? "—"} min</span>
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
                ))
              ) : (
                <Card className={emptyCardClass}>
                  <CardContent className="py-6 text-center text-slate-blue text-sm">
                    No exams in this course yet. Check back later.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
