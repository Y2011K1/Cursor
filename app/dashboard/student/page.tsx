import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText, Award, Plus, Video, GraduationCap, File, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { CourseSwitcher } from "@/components/course-switcher"
import { StudentTestimonialCard } from "@/components/student-testimonial-card"
import { unstable_noStore as noStore } from "next/cache"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>
}) {
  noStore()
  const profile = await requireRole("student")
  const supabase = await createClient()
  const raw = await searchParams
  const courseParam = typeof raw.course === "string" ? raw.course : Array.isArray(raw.course) ? raw.course[0] : undefined

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      course_id,
      course:courses!inner (
        id,
        name,
        subject,
        is_active,
        teacher:profiles!classrooms_teacher_id_fkey ( id, full_name )
      )
    `)
    .eq("student_id", profile.id)
    .eq("is_active", true)

  const activeEnrollments = enrollments?.filter((e: any) => e.course?.is_active === true) || []

  // When no ?course= in URL, default to the course that has content (so user doesn't land on empty course)
  let chosenEnrollment: (typeof activeEnrollments)[0] | undefined
  if (courseParam) {
    chosenEnrollment = activeEnrollments.find((e: any) => (e.course_id || e.course?.id) === courseParam)
  }
  if (!chosenEnrollment && activeEnrollments.length > 0) {
    const enrolledIds = activeEnrollments.map((e: any) => e.course_id || e.course?.id).filter(Boolean) as string[]
    const [l, m, q, ex] = await Promise.all([
      enrolledIds.length > 0 ? supabase.from("lessons").select("course_id").in("course_id", enrolledIds).eq("is_published", true) : { data: [] },
      enrolledIds.length > 0 ? supabase.from("course_materials").select("course_id").in("course_id", enrolledIds).eq("is_published", true) : { data: [] },
      enrolledIds.length > 0 ? supabase.from("quizzes").select("course_id").in("course_id", enrolledIds).eq("is_published", true) : { data: [] },
      enrolledIds.length > 0 ? supabase.from("exams").select("course_id").in("course_id", enrolledIds).eq("is_published", true) : { data: [] },
    ])
    const countByCourse = new Map<string, number>()
    for (const row of [...(l.data || []), ...(m.data || []), ...(q.data || []), ...(ex.data || [])]) {
      const cid = (row as { course_id: string }).course_id
      countByCourse.set(cid, (countByCourse.get(cid) || 0) + 1)
    }
    const sorted = [...activeEnrollments].sort((a, b) => {
      const idA = a.course_id || (Array.isArray(a.course) ? a.course[0]?.id : (a.course as { id?: string })?.id)
      const idB = b.course_id || (Array.isArray(b.course) ? b.course[0]?.id : (b.course as { id?: string })?.id)
      return (countByCourse.get(idB) || 0) - (countByCourse.get(idA) || 0)
    })
    chosenEnrollment = sorted[0]
  }
  const activeCourseEnrollment = chosenEnrollment

  // Persist selected course in URL so links and refreshes stay on the same course
  if (activeCourseEnrollment && !courseParam) {
    const e = activeCourseEnrollment as { course_id?: string; course?: { id: string } | Array<{ id: string }> }
    const id = e.course_id ?? (Array.isArray(e.course) ? e.course[0]?.id : e.course?.id)
    if (id) redirect(`/dashboard/student?course=${id}`)
  }

  if (!activeCourseEnrollment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-sky via-white to-light-sky">
        <Navigation userRole="student" userName={profile.full_name} />
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-deep-teal/10 mb-4">
                <BookOpen className="h-10 w-10 text-deep-teal" />
              </div>
              <h1 className="text-4xl font-bold text-deep-teal mb-2">Welcome, {profile.full_name}!</h1>
              <p className="text-lg text-slate-blue">Start your learning journey by joining a course</p>
            </div>
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl max-w-2xl mx-auto bg-gradient-to-br from-white to-blue-50/50">
              <CardContent className="p-8 text-center">
                <p className="text-slate-blue mb-6">
                  Browse available courses and join one to start learning.
                </p>
                <Button size="lg" className="bg-deep-teal hover:bg-deep-teal/90 text-white px-8 rounded-xl h-12 shadow-sm hover:shadow transition-all duration-300 font-medium" asChild>
                  <Link href="/dashboard/student/browse-courses">
                    <Plus className="h-5 w-5 mr-2" />
                    Browse Courses
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const courseRaw = activeCourseEnrollment.course as unknown
  const activeCourse = (Array.isArray(courseRaw) ? courseRaw[0] : courseRaw) as { id: string; name: string; subject: string | null; teacher: { full_name: string } | null }
  // Use enrollment's course_id so links always match the course we're showing (no join mismatch)
  const activeCourseId = (activeCourseEnrollment as { course_id?: string }).course_id ?? activeCourse.id

  const [lessonsResult, quizzesResult, examsResult, materialsResult] = await Promise.all([
    supabase.from("lessons").select("*").eq("course_id", activeCourseId).eq("is_published", true).order("order_index", { ascending: true }),
    supabase.from("quizzes").select("*").eq("course_id", activeCourseId).eq("is_published", true).order("created_at", { ascending: false }),
    supabase.from("exams").select("*").eq("course_id", activeCourseId).eq("is_published", true).order("created_at", { ascending: false }),
    supabase.from("course_materials").select("*").eq("course_id", activeCourseId).eq("is_published", true).order("order_index", { ascending: true }),
  ])

  const lessons = lessonsResult.data || []
  const quizzes = quizzesResult.data || []
  const exams = examsResult.data || []
  const materials = materialsResult.data || []

  const lessonIds = lessons.map((l) => l.id)
  const quizIds = quizzes.map((q) => q.id)
  const examIds = exams.map((e) => e.id)
  const materialIds = materials.map((m) => m.id)

  const [lessonProgressRes, quizSubsRes, examSubsRes, materialAccessRes] = await Promise.all([
    lessonIds.length > 0
      ? supabase.from("lesson_progress").select("lesson_id, is_completed").eq("student_id", profile.id).in("lesson_id", lessonIds)
      : { data: [] },
    quizIds.length > 0
      ? supabase.from("quiz_submissions").select("quiz_id, score, total_points").eq("student_id", profile.id).eq("is_completed", true).in("quiz_id", quizIds)
      : { data: [] },
    examIds.length > 0
      ? supabase.from("exam_submissions").select("exam_id, score, total_points").eq("student_id", profile.id).eq("is_completed", true).in("exam_id", examIds)
      : { data: [] },
    materialIds.length > 0
      ? supabase.from("material_access").select("material_id").eq("student_id", profile.id).in("material_id", materialIds)
      : { data: [] },
  ])

  const completedLessonIds = new Set(
    (lessonProgressRes.data || []).filter((p) => p.is_completed).map((p) => p.lesson_id)
  )
  const completedQuizIds = new Set((quizSubsRes.data || []).map((s) => s.quiz_id))
  const completedExamIds = new Set((examSubsRes.data || []).map((s) => s.exam_id))
  const accessedMaterialIds = new Set((materialAccessRes.data || []).map((m) => m.material_id))

  const completedLessons = lessons.filter((l) => completedLessonIds.has(l.id)).length
  const completedMaterials = materials.filter((m) => accessedMaterialIds.has(m.id)).length
  const completedQuizzes = quizzes.filter((q) => completedQuizIds.has(q.id)).length
  const completedExams = exams.filter((e) => completedExamIds.has(e.id)).length

  const lessonsProgress = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0
  const materialsProgress = materials.length > 0 ? Math.round((completedMaterials / materials.length) * 100) : 0
  const assignmentsProgress = quizzes.length > 0 ? Math.round((completedQuizzes / quizzes.length) * 100) : 0
  const examsProgress = exams.length > 0 ? Math.round((completedExams / exams.length) * 100) : 0

  const totalItems = lessons.length + quizzes.length + exams.length
  const completedItems = completedLessons + completedQuizzes + completedExams
  const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  const allScores = [...(quizSubsRes.data || []), ...(examSubsRes.data || [])]
  const avgScore =
    allScores.length > 0
      ? Math.round(
          allScores.reduce((sum, s) => {
            const tp = (s as any).total_points
            const pct = tp > 0 ? (((s as any).score || 0) / tp) * 100 : 0
            return sum + pct
          }, 0) / allScores.length
        )
      : 0

  const coursesForSwitcher = activeEnrollments.map((e: any) => ({
    id: e.course.id,
    name: e.course.name,
    subject: e.course.subject,
  }))

  const lessonsHref = `/dashboard/student/course/${activeCourseId}/lessons`
  const materialsHref = `/dashboard/student/course/${activeCourseId}/materials`
  const assignmentsHref = `/dashboard/student/course/${activeCourseId}/assignments`
  const examsHref = `/dashboard/student/course/${activeCourseId}/exams`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-deep-teal via-soft-mint/80 to-success-green rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-1">
                  Welcome back, {profile.full_name}!
                </h1>
                <p className="text-white/80 text-lg font-medium">{activeCourse.name}</p>
                {activeCourse.subject && (
                  <p className="text-white/60 text-sm">{activeCourse.subject}</p>
                )}
                <p className="text-white/60 text-sm">
                  Teacher: {activeCourse.teacher?.full_name ?? "Unknown"}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                {coursesForSwitcher.length > 1 && (
                  <CourseSwitcher courses={coursesForSwitcher} activeCourseId={activeCourse.id} />
                )}
                <Button
                  size="default"
                  className="bg-white text-deep-teal hover:bg-white/90 font-medium rounded-xl shadow-sm"
                  asChild
                >
                  <Link href="/dashboard/student/browse-courses">
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Courses
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* 4 Category Cards — each goes to its own content page */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href={lessonsHref}>
              <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-bl-[80px]" />
                <CardContent className="p-6 flex flex-col h-full relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                      <Video className="h-7 w-7 text-orange-600" />
                    </div>
                    {lessons.length > 0 && (
                      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center shadow-lg">
                        {lessons.length}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">Video Lectures</h3>
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {lessons.length} lesson{lessons.length !== 1 ? "s" : ""} available
                  </p>
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-semibold text-orange-600">{lessonsProgress}%</span>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-full max-w-[140px]">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${lessonsProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={materialsHref}>
              <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-transparent rounded-bl-[80px]" />
                <CardContent className="p-6 flex flex-col h-full relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                      <File className="h-7 w-7 text-purple-600" />
                    </div>
                    {materials.length > 0 && (
                      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center shadow-lg">
                        {materials.length}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Course Materials</h3>
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {materials.length} material{materials.length !== 1 ? "s" : ""} available
                  </p>
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-semibold text-purple-600">{materialsProgress}%</span>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-full max-w-[140px]">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${materialsProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={examsHref}>
              <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-[80px]" />
                <CardContent className="p-6 flex flex-col h-full relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                      <GraduationCap className="h-7 w-7 text-blue-600" />
                    </div>
                    {exams.length > 0 && (
                      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center shadow-lg">
                        {exams.length}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Exams</h3>
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {exams.length} exam{exams.length !== 1 ? "s" : ""} available
                  </p>
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-semibold text-blue-600">{examsProgress}%</span>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-full max-w-[140px]">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${examsProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={assignmentsHref}>
              <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/5 to-transparent rounded-bl-[80px]" />
                <CardContent className="p-6 flex flex-col h-full relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                      <FileText className="h-7 w-7 text-green-600" />
                    </div>
                    {quizzes.length > 0 && (
                      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center shadow-lg">
                        {quizzes.length}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Electronic Assignments</h3>
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {quizzes.length} assignment{quizzes.length !== 1 ? "s" : ""} available
                  </p>
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-semibold text-green-600">{assignmentsProgress}%</span>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-full max-w-[140px]">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${assignmentsProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Overall Progress Card — no points, no ranks */}
          <Card className="border-none shadow-sm rounded-xl bg-gradient-to-br from-white to-blue-50/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-deep-teal flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-600">Course Completion</span>
                  <span className="text-sm font-bold text-deep-teal">{overallProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-deep-teal to-success-green h-3 rounded-full transition-all duration-700"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
              {[
                { label: "Video Lectures", value: lessonsProgress, color: "bg-orange-500" },
                { label: "Course Materials", value: materialsProgress, color: "bg-purple-500" },
                { label: "Exams", value: examsProgress, color: "bg-blue-500" },
                { label: "Assignments", value: assignmentsProgress, color: "bg-green-500" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs font-semibold text-slate-700">{value}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`${color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
              {avgScore > 0 && (
                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-1">
                    <Award className="h-4 w-4" /> Average Score
                  </span>
                  <span className="text-sm font-bold text-success-green">{avgScore}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Testimonial — show when student has finished some content */}
          {completedItems > 0 && (
            <StudentTestimonialCard courseName={activeCourse.name} />
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
