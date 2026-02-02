import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { BookOpen, FileText, GraduationCap, Plus, Eye, EyeOff, File, User, CheckCircle2, Award, Trophy, BarChart3, TrendingUp } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { AddLessonDialog } from "@/components/add-lesson-dialog"
import { PublishClassroomButton } from "@/components/publish-classroom-button"
import { AddQuizWithQuestionsDialog } from "@/components/add-quiz-with-questions-dialog"
import { AddExamWithQuestionsDialog } from "@/components/add-exam-with-questions-dialog"
import { EditClassroomDialog } from "@/components/edit-classroom-dialog"
import { EditLessonButton } from "@/components/edit-lesson-button"
import { DeleteQuizButton } from "@/components/delete-quiz-button"
import { DeleteExamButton } from "@/components/delete-exam-button"
import { AddCourseMaterialDialog } from "@/components/add-course-material-dialog"
import { PublishMaterialButton } from "@/components/publish-material-button"
import { DeleteMaterialButton } from "@/components/delete-material-button"
import { PublishLessonButton } from "@/components/publish-lesson-button"
import { DeleteLessonButton } from "@/components/delete-lesson-button"
import { PublishQuizButtonInline } from "@/components/publish-quiz-button-inline"
import { PublishExamButton } from "@/components/publish-exam-button"
import { unstable_noStore as noStore } from "next/cache"
import { calculateRank, calculateTotalPoints } from "@/lib/ranking"
import { ProgressBarDialog } from "@/components/progress-bar-dialog"
import { LessonVideoStatusBadge } from "@/components/lesson-video-status-badge"

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ClassroomDetailPageProps {
  params: Promise<{ classroomId: string }>
}

export default async function ClassroomDetailPage({ params }: ClassroomDetailPageProps) {
  try {
    noStore() // Prevent caching
    const { classroomId } = await params
    const profile = await requireRole("teacher")
    const supabase = await createClient()

    // Reject invalid UUID before querying (e.g. "undefined" from client)
    if (!classroomId || classroomId === "undefined" || classroomId.length < 30) {
      return (
        <div className="min-h-screen bg-light-sky flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-deep-teal mb-2">Classroom Not Found</h1>
            <p className="text-slate-blue mb-4">
              The classroom you&apos;re trying to access doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <div className="mt-4">
              <a href="/dashboard/teacher" className="text-deep-teal hover:underline">Back to Dashboard</a>
            </div>
          </div>
        </div>
      )
    }

    // Get teacher's classroom and verify ownership
    const { data: classroom, error: classroomError } = await supabase
      .from("classrooms")
      .select("*")
      .eq("id", classroomId)
      .eq("teacher_id", profile.id)
      .single()

    if (classroomError || !classroom) {
      console.error("Classroom fetch error:", classroomError)
      console.error("Classroom ID from params:", classroomId)
      console.error("Profile ID:", profile.id)
      
      // Return a helpful error page instead of just notFound()
      return (
        <div className="min-h-screen bg-light-sky flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-deep-teal mb-2">Classroom Not Found</h1>
            <p className="text-slate-blue mb-4">
              The classroom you&apos;re trying to access doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            {classroomError && (
              <div className="mt-4 p-4 bg-warm-coral/10 rounded-md">
                <p className="text-sm text-warm-coral font-semibold mb-2">Error Details:</p>
                <p className="text-xs text-slate-blue">{classroomError.message}</p>
                <p className="text-xs text-slate-blue mt-1">Code: {classroomError.code}</p>
              </div>
            )}
            <div className="mt-4">
              <a 
                href="/dashboard/teacher" 
                className="text-deep-teal hover:underline"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      )
    }

    // Get all data in parallel for better performance
    const [lessonsResult, quizzesResult, examsResult, materialsResult, enrollmentsResult] = await Promise.all([
      supabase
        .from("lessons")
        .select("*")
        .eq("classroom_id", classroom.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("quizzes")
        .select("*")
        .eq("classroom_id", classroom.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("exams")
        .select("*")
        .eq("classroom_id", classroom.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("course_materials")
        .select("*")
        .eq("classroom_id", classroom.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("enrollments")
        .select("student_id, profiles(id, full_name)")
        .eq("classroom_id", classroom.id)
        .eq("is_active", true)
    ])

    const lessons = lessonsResult.data
    const quizzes = quizzesResult.data
    const exams = examsResult.data
    const materials = materialsResult.data
    const enrollments = enrollmentsResult.data || []

    // Get student IDs enrolled in this classroom
    const studentIds = enrollments.map((e: any) => e.student_id).filter(Boolean)
    
    // Get classroom-specific content counts (only published)
    const totalLessons = lessons?.filter((l) => l.is_published).length || 0
    const totalQuizzes = quizzes?.filter((q) => q.is_published).length || 0
    const totalExams = exams?.filter((e) => e.is_published).length || 0
    const totalMaterials = materials?.filter((m) => m.is_published).length || 0

    // Get progress for students in this classroom only
    const materialIds = materials?.map((m: any) => m.id) || []
    const [studentLessonProgress, studentQuizSubmissions, studentExamSubmissions, studentMaterialAccess] = await Promise.all([
      studentIds.length > 0 && lessons && lessons.length > 0
        ? supabase
            .from("lesson_progress")
            .select("student_id, lesson_id, is_completed")
            .in("student_id", studentIds)
            .eq("is_completed", true)
            .in("lesson_id", lessons.map((l) => l.id))
        : Promise.resolve({ data: [], error: null }),
      studentIds.length > 0 && quizzes && quizzes.length > 0
        ? supabase
            .from("quiz_submissions")
            .select("student_id, quiz_id, score, total_points, is_completed")
            .in("student_id", studentIds)
            .eq("is_completed", true)
            .in("quiz_id", quizzes.map((q) => q.id))
        : Promise.resolve({ data: [], error: null }),
      studentIds.length > 0 && exams && exams.length > 0
        ? supabase
            .from("exam_submissions")
            .select("student_id, exam_id, score, total_points, is_completed")
            .in("student_id", studentIds)
            .eq("is_completed", true)
            .in("exam_id", exams.map((e) => e.id))
        : Promise.resolve({ data: [], error: null }),
      studentIds.length > 0 && materialIds.length > 0
        ? supabase
            .from("material_access")
            .select("student_id, material_id")
            .in("student_id", studentIds)
            .in("material_id", materialIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    // Calculate individual student progress for this classroom
    const studentProgressMap = new Map<string, {
      name: string
      lessonsCompleted: number
      assignmentsCompleted: number
      examsCompleted: number
      materialsCompleted: number
      materialsCount: number
      avgScore: number
      totalProgress: number
      totalPoints: number
      rank: ReturnType<typeof calculateRank>
    }>()

    enrollments.forEach((enrollment: any) => {
      const studentId = enrollment.student_id
      const studentName = (enrollment.profiles && Array.isArray(enrollment.profiles) 
        ? enrollment.profiles[0]?.full_name 
        : enrollment.profiles?.full_name) || "Unknown Student"

      const studentLessons = (studentLessonProgress.data || []).filter((p) => p.student_id === studentId)
      const studentQuizzes = (studentQuizSubmissions.data || []).filter((s) => s.student_id === studentId)
      const studentExams = (studentExamSubmissions.data || []).filter((s) => s.student_id === studentId)
      const studentMaterials = (studentMaterialAccess.data || []).filter((m) => m.student_id === studentId)

      const lessonsCompleted = studentLessons.length
      const assignmentsCompleted = studentQuizzes.length
      const examsCompleted = studentExams.length
      const materialsCompleted = studentMaterials.length

      // Calculate points (assignments and exams are 2 points each)
      const completedAssignments = assignmentsCompleted
      const completedExamsCount = examsCompleted
      const totalPoints = calculateTotalPoints({
        completedLessons: lessonsCompleted,
        completedMaterials: materialsCompleted,
        completedAssignments,
        completedExams: completedExamsCount,
      })

      // Calculate ranking
      const rank = calculateRank(totalPoints)

      // Calculate average score for this student (only for this classroom)
      const studentScores = [...studentQuizzes, ...studentExams]
      const avgScore = studentScores.length > 0
        ? Math.round(
            studentScores.reduce((sum, s) => {
              const percentage = s.total_points > 0 ? ((s.score || 0) / s.total_points) * 100 : 0
              return sum + percentage
            }, 0) / studentScores.length
          )
        : 0

      // Calculate total progress percentage (only for this classroom's content)
      const studentTotalContent = totalLessons + totalQuizzes + totalExams
      const studentTotalCompleted = lessonsCompleted + assignmentsCompleted + examsCompleted
      const totalProgress = studentTotalContent > 0
        ? Math.round((studentTotalCompleted / studentTotalContent) * 100)
        : 0

      studentProgressMap.set(studentId, {
        name: studentName,
        lessonsCompleted,
        assignmentsCompleted,
        examsCompleted,
        materialsCompleted,
        materialsCount: totalMaterials,
        avgScore,
        totalProgress,
        totalPoints,
        rank,
      })
    })

    // Convert to array and sort by total points (descending) for ranking display
    const studentProgressList = Array.from(studentProgressMap.values()).sort(
      (a, b) => b.totalPoints - a.totalPoints
    )

    // Calculate classroom statistics
    const enrolledStudents = enrollments.length
    const avgStudentProgress = studentProgressList.length > 0
      ? Math.round(studentProgressList.reduce((sum, s) => sum + s.totalProgress, 0) / studentProgressList.length)
      : 0
    const avgStudentScore = studentProgressList.length > 0 && studentProgressList.some(s => s.avgScore > 0)
      ? Math.round(studentProgressList.filter(s => s.avgScore > 0).reduce((sum, s) => sum + s.avgScore, 0) / studentProgressList.filter(s => s.avgScore > 0).length)
      : 0

    return (
      <div className="min-h-screen bg-light-sky">
        <Navigation userRole="teacher" userName={profile.full_name} />
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Classroom header */}
            <div className="bg-gradient-to-r from-deep-teal/10 to-soft-mint/10 rounded-xl p-6 border border-deep-teal/20">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-deep-teal">
                      {classroom.name}
                    </h1>
                    {classroom.is_active ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-success-green/20 text-success-green flex items-center gap-1 font-medium">
                        <Eye className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-blue/20 text-slate-blue flex items-center gap-1 font-medium">
                        <EyeOff className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                  {classroom.subject && (
                    <span className="inline-block px-3 py-1 bg-soft-mint/50 rounded-md text-sm font-medium text-dark-text mb-2">
                      {classroom.subject}
                    </span>
                  )}
                  {classroom.description && (
                    <p className="text-slate-blue text-sm md:text-base max-w-2xl">
                      {classroom.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-blue">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {lessons?.length || 0} Lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {quizzes?.length || 0} Quizzes
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {exams?.length || 0} Exams
                    </span>
                    <span className="flex items-center gap-1">
                      <File className="h-4 w-4" />
                      {materials?.length || 0} Materials
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Classroom Statistics */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-deep-teal text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Classroom Statistics
                </CardTitle>
                <CardDescription>
                  Overview of your classroom performance
                </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-light-sky rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-deep-teal" />
                    <span className="text-sm text-slate-blue">Enrolled Students</span>
                  </div>
                  <div className="text-2xl font-bold text-deep-teal">{enrolledStudents}</div>
                </div>
                <div className="p-4 bg-light-sky rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-deep-teal" />
                    <span className="text-sm text-slate-blue">Avg Progress</span>
                  </div>
                  <div className="text-2xl font-bold text-deep-teal">{avgStudentProgress}%</div>
                </div>
                <div className="p-4 bg-light-sky rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-deep-teal" />
                    <span className="text-sm text-slate-blue">Avg Score</span>
                  </div>
                  <div className="text-2xl font-bold text-deep-teal">{avgStudentScore > 0 ? `${avgStudentScore}%` : 'N/A'}</div>
                </div>
                <div className="p-4 bg-light-sky rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-deep-teal" />
                    <span className="text-sm text-slate-blue">Top Rank</span>
                  </div>
                  <div className="text-2xl font-bold text-deep-teal">
                    {studentProgressList.length > 0 ? studentProgressList[0].rank.icon : '—'}
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Main content: 2 columns on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-deep-teal flex items-center gap-2 text-lg">
                        <BookOpen className="h-5 w-5" />
                        Lessons
                      </CardTitle>
                      <AddLessonDialog classroomId={classroom.id} />
                    </div>
                    <CardDescription>Video lectures and lesson content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {lessons && lessons.length > 0 ? (
                      <div className="space-y-3">
                        {lessons.map((lesson, index) => (
                          <div
                            key={lesson.id}
                            className="p-4 border border-input rounded-lg hover:bg-light-sky/50 transition-colors"
                          >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-deep-teal">
                                {index + 1}. {lesson.title}
                              </h3>
                              {lesson.content && (
                                <p className="text-sm text-slate-blue mt-1 line-clamp-2">
                                  {lesson.content}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap mt-2 text-xs text-slate-blue">
                                {lesson.video_url && (
                                  <>
                                    <span>📹 Video</span>
                                    <LessonVideoStatusBadge videoUrl={lesson.video_url} />
                                  </>
                                )}
                                {lesson.is_published ? (
                                  <span className="text-success-green">Published</span>
                                ) : (
                                  <span>Draft</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <PublishLessonButton
                                lessonId={lesson.id}
                                isPublished={lesson.is_published}
                                videoUrl={lesson.video_url}
                              />
                              <EditLessonButton />
                              <DeleteLessonButton
                                lessonId={lesson.id}
                                lessonTitle={lesson.title}
                                classroomId={classroom.id}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-blue text-center py-8">
                      No lessons yet. Add your first lesson to get started.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-deep-teal flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5" />
                      Quizzes
                    </CardTitle>
                    <AddQuizWithQuestionsDialog classroomId={classroom.id} />
                  </div>
                  <CardDescription>Assignments and practice quizzes</CardDescription>
                </CardHeader>
                <CardContent>
                  {quizzes && quizzes.length > 0 ? (
                    <div className="space-y-3">
                      {quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="p-4 border border-input rounded-lg hover:bg-light-sky/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-deep-teal">
                                {quiz.title}
                              </h3>
                              {quiz.description && (
                                <p className="text-sm text-slate-blue mt-1">
                                  {quiz.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-blue">
                                {quiz.time_limit_minutes && (
                                  <span>⏱️ {quiz.time_limit_minutes} min</span>
                                )}
                                <span>Max attempts: {quiz.max_attempts}</span>
                                {quiz.is_published ? (
                                  <span className="text-success-green">Published</span>
                                ) : (
                                  <span>Draft</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <PublishQuizButtonInline
                                quizId={quiz.id}
                                isPublished={quiz.is_published}
                              />
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/teacher/classroom/${classroom.id}/quiz/${quiz.id}`}>
                                  Edit
                                </Link>
                              </Button>
                              <DeleteQuizButton
                                quizId={quiz.id}
                                quizTitle={quiz.title}
                                classroomId={classroom.id}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-blue text-center py-8">
                      No quizzes yet. Add your first quiz to get started.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-deep-teal flex items-center gap-2 text-lg">
                      <GraduationCap className="h-5 w-5" />
                      Exams
                    </CardTitle>
                    <AddExamWithQuestionsDialog classroomId={classroom.id} />
                  </div>
                  <CardDescription>Timed exams (one attempt)</CardDescription>
                </CardHeader>
                <CardContent>
                  {exams && exams.length > 0 ? (
                    <div className="space-y-3">
                      {exams.map((exam) => (
                        <div
                          key={exam.id}
                          className="p-4 border border-input rounded-lg hover:bg-light-sky/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-deep-teal">
                                {exam.title}
                              </h3>
                              {exam.description && (
                                <p className="text-sm text-slate-blue mt-1">
                                  {exam.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-blue">
                                <span>⏱️ {exam.time_limit_minutes} min</span>
                                <span>One attempt only</span>
                                {exam.due_date && (
                                  <span>📅 Due: {new Date(exam.due_date).toLocaleDateString()}</span>
                                )}
                                {exam.is_published ? (
                                  <span className="text-success-green">Published</span>
                                ) : (
                                  <span>Draft</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <PublishExamButton
                                examId={exam.id}
                                isPublished={exam.is_published}
                              />
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/teacher/classroom/${classroom.id}/exam/${exam.id}`}>
                                  Edit
                                </Link>
                              </Button>
                              <DeleteExamButton
                                examId={exam.id}
                                examTitle={exam.title}
                                classroomId={classroom.id}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-blue text-center py-8">
                      No exams yet. Add your first exam to get started.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-deep-teal flex items-center gap-2 text-lg">
                      <File className="h-5 w-5" />
                      Course Materials
                    </CardTitle>
                    <AddCourseMaterialDialog classroomId={classroom.id} />
                  </div>
                  <CardDescription>Files and resources for students</CardDescription>
                </CardHeader>
                <CardContent>
                  {materials && materials.length > 0 ? (
                    <div className="space-y-3">
                      {materials.map((material: any) => (
                        <div
                          key={material.id}
                          className="p-4 border border-input rounded-lg hover:bg-light-sky/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-deep-teal">
                                {material.title}
                              </h3>
                              {material.description && (
                                <p className="text-sm text-slate-blue mt-1">
                                  {material.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-blue">
                                <span>📄 {material.file_type || 'File'}</span>
                                {material.is_published ? (
                                  <span className="text-success-green">Published</span>
                                ) : (
                                  <span>Draft</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <PublishMaterialButton
                                materialId={material.id}
                                isPublished={material.is_published}
                              />
                              <DeleteMaterialButton
                                materialId={material.id}
                                materialTitle={material.title}
                                classroomId={classroom.id}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-blue text-center py-8">
                      No course materials yet. Add your first material to get started.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-deep-teal text-lg">Content Overview</CardTitle>
                  <CardDescription>
                    Your classroom content statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-light-sky rounded-lg">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-deep-teal" />
                        <span className="text-slate-blue">Lessons</span>
                      </div>
                      <span className="font-bold text-lg text-deep-teal">{lessons?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-light-sky rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-deep-teal" />
                        <span className="text-slate-blue">Quizzes</span>
                      </div>
                      <span className="font-bold text-lg text-deep-teal">{quizzes?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-light-sky rounded-lg">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-deep-teal" />
                        <span className="text-slate-blue">Exams</span>
                      </div>
                      <span className="font-bold text-lg text-deep-teal">{exams?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-light-sky rounded-lg">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-deep-teal" />
                        <span className="text-slate-blue">Course Materials</span>
                      </div>
                      <span className="font-bold text-lg text-deep-teal">{materials?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-deep-teal text-lg">Classroom Actions</CardTitle>
                  <CardDescription>
                    Manage your classroom settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <PublishClassroomButton
                    classroomId={classroom.id}
                    isActive={classroom.is_active}
                  />
                  <EditClassroomDialog
                    classroomId={classroom.id}
                    currentData={{
                      name: classroom.name,
                      description: classroom.description,
                      subject: classroom.subject,
                      max_students: classroom.max_students,
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

            {/* Student progress (full width) */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-deep-teal text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Student Progress
                </CardTitle>
                <CardDescription>
                  Progress and ranking for enrolled students
                </CardDescription>
              </CardHeader>
              <CardContent>
              {studentProgressList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {studentProgressList.map((student, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-lg font-bold text-deep-teal">{student.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${student.rank.bgColor} ${student.rank.color}`}>
                              {student.rank.icon} {student.rank.rank}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-deep-teal">{student.totalPoints}</div>
                              <div className="text-xs text-slate-blue mt-0.5">Total Points</div>
                            </div>
                            {student.avgScore > 0 && (
                              <div className="text-center">
                                <div className="text-xl font-bold text-success-green flex items-center justify-center gap-1">
                                  <Award className="h-4 w-4" />
                                  {student.avgScore}%
                                </div>
                                <div className="text-xs text-slate-blue mt-0.5">Avg Score</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {student.rank.nextRankPoints && (() => {
                        const currentThreshold = student.rank.rank === "Bronze" ? 0 : student.rank.rank === "Silver" ? 50 : student.rank.rank === "Gold" ? 150 : 300
                        const pointsNeeded = student.rank.nextRankPoints - student.totalPoints
                        const pointsInCurrentRank = student.totalPoints - currentThreshold
                        const pointsForNextRank = student.rank.nextRankPoints - currentThreshold
                        const nextRankName = student.rank.nextRankPoints === 50 ? "Silver" : student.rank.nextRankPoints === 150 ? "Gold" : "Platinum"
                        const nextRankIcon = student.rank.nextRankPoints === 50 ? "🥈" : student.rank.nextRankPoints === 150 ? "🥇" : "💎"
                        const progressPercent = Math.min(100, Math.max(0, (pointsInCurrentRank / pointsForNextRank) * 100))
                        
                        return (
                          <div className="space-y-2 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-deep-teal">
                                Next Level: {nextRankName}
                              </div>
                              <div className="text-xs text-slate-blue">
                                {pointsInCurrentRank} / {pointsForNextRank} points
                              </div>
                            </div>
                            <ProgressBarDialog
                              lessonsCompleted={student.lessonsCompleted}
                              materialsCompleted={student.materialsCompleted}
                              assignmentsCompleted={student.assignmentsCompleted}
                              examsCompleted={student.examsCompleted}
                            >
                              <div className="flex items-center gap-3 text-sm text-slate-blue">
                                <span className="font-medium min-w-[60px]">{student.rank.rank}</span>
                                <div className="flex-1 relative group">
                                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                                    <div
                                      className="bg-deep-teal h-6 rounded-full transition-all duration-1000 ease-out relative"
                                      style={{ width: `${progressPercent}%` }}
                                    >
                                      {progressPercent > 10 && (
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                                          {Math.round(progressPercent)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <span className="font-medium flex items-center gap-1 min-w-[80px] justify-end">
                                  {nextRankName} {nextRankIcon}
                                </span>
                              </div>
                            </ProgressBarDialog>
                            {pointsNeeded > 0 && (
                              <div className="text-xs text-slate-blue text-center pt-1">
                                {pointsNeeded} more {pointsNeeded === 1 ? 'point' : 'points'} to reach {nextRankName}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-blue">
                  <User className="h-12 w-12 mx-auto mb-2 text-slate-blue/50" />
                  <p>No students enrolled in this classroom yet</p>
                </div>
              )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  } catch (error: any) {
    // If it's a redirect, re-throw it
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    // Handle authentication errors
    console.error("Classroom page error:", error)
    if (error?.message?.includes("Unauthorized")) {
      redirect("/login")
    }
    notFound()
  }
}
