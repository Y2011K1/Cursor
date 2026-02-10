import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText, Award, Plus, PlayCircle, Video, GraduationCap, File, TrendingUp, Quote } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ClassroomSwitcher } from "@/components/classroom-switcher"
import { unstable_noStore as noStore } from "next/cache"

export const dynamic = "force-dynamic"
export const revalidate = 0

type CourseSection = {
  course: { id: string; name: string; subject: string | null; teacher: { full_name: string } | null }
  lessons: any[]
  quizzes: any[]
  exams: any[]
  materials: any[]
  completedLessons: number
  completedMaterials: number
  completedQuizzes: number
  completedExams: number
  lessonsProgress: number
  materialsProgress: number
  assignmentsProgress: number
  examsProgress: number
}

export default async function StudentDashboardPage() {
  noStore()
  const profile = await requireRole("student")
  const supabase = await createClient()

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
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
  const courseIds = activeEnrollments?.map((e: any) => e.course?.id).filter(Boolean) || []

  if (courseIds.length === 0) {
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

  const [lessonsResult, quizzesResult, examsResult, materialsResult] = await Promise.all([
    supabase.from("lessons").select("id, course_id").eq("is_published", true).in("course_id", courseIds),
    supabase.from("quizzes").select("id, course_id").eq("is_published", true).in("course_id", courseIds).order("created_at", { ascending: false }),
    supabase.from("exams").select("id, course_id").eq("is_published", true).in("course_id", courseIds),
    supabase.from("course_materials").select("id, course_id").eq("is_published", true).in("course_id", courseIds),
  ])

  const allLessons = lessonsResult.data || []
  const allQuizzes = quizzesResult.data || []
  const allExams = examsResult.data || []
  const allMaterials = materialsResult.data || []

  const lessonIds = allLessons.map((l) => l.id)
  const quizIds = allQuizzes.map((q) => q.id)
  const examIds = allExams.map((e) => e.id)
  const materialIds = allMaterials.map((m) => m.id)

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

  const lessonsByCourse = new Map<string, any[]>()
  const quizzesByCourse = new Map<string, any[]>()
  const examsByCourse = new Map<string, any[]>()
  const materialsByCourse = new Map<string, any[]>()
  for (const l of allLessons) {
    if (!lessonsByCourse.has(l.course_id)) lessonsByCourse.set(l.course_id, [])
    lessonsByCourse.get(l.course_id)!.push(l)
  }
  for (const q of allQuizzes) {
    if (!quizzesByCourse.has(q.course_id)) quizzesByCourse.set(q.course_id, [])
    quizzesByCourse.get(q.course_id)!.push(q)
  }
  for (const e of allExams) {
    if (!examsByCourse.has(e.course_id)) examsByCourse.set(e.course_id, [])
    examsByCourse.get(e.course_id)!.push(e)
  }
  for (const m of allMaterials) {
    if (!materialsByCourse.has(m.course_id)) materialsByCourse.set(m.course_id, [])
    materialsByCourse.get(m.course_id)!.push(m)
  }

  const courseSections: CourseSection[] = activeEnrollments.map((e: any) => {
    const course = e.course
    const cid = course.id
    const lessons = lessonsByCourse.get(cid) || []
    const quizzes = quizzesByCourse.get(cid) || []
    const exams = examsByCourse.get(cid) || []
    const materials = materialsByCourse.get(cid) || []

    const completedLessons = lessons.filter((l) => completedLessonIds.has(l.id)).length
    const completedQuizzes = quizzes.filter((q) => completedQuizIds.has(q.id)).length
    const completedExams = exams.filter((x) => completedExamIds.has(x.id)).length
    const completedMaterials = materials.filter((m) => accessedMaterialIds.has(m.id)).length

    const lessonsProgress = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0
    const materialsProgress = materials.length > 0 ? Math.round((completedMaterials / materials.length) * 100) : 0
    const assignmentsProgress = quizzes.length > 0 ? Math.round((completedQuizzes / quizzes.length) * 100) : 0
    const examsProgress = exams.length > 0 ? Math.round((completedExams / exams.length) * 100) : 0

    return {
      course: { id: cid, name: course.name, subject: course.subject, teacher: course.teacher },
      lessons,
      quizzes,
      exams,
      materials,
      completedLessons,
      completedMaterials,
      completedQuizzes,
      completedExams,
      lessonsProgress,
      materialsProgress,
      assignmentsProgress,
      examsProgress,
    }
  })

  const coursesForSwitcher = activeEnrollments.map((e: any) => ({
    id: e.course.id,
    name: e.course.name,
    subject: e.course.subject,
  }))

  const totalLessons = allLessons.length
  const totalQuizzes = allQuizzes.length
  const totalExams = allExams.length
  const totalMaterials = allMaterials.length
  const totalItems = totalLessons + totalQuizzes + totalExams
  const completedItems =
    completedLessonIds.size + completedQuizIds.size + completedExamIds.size
  const overallProgress =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  const aggLessonsPct =
    totalLessons > 0 ? Math.round((completedLessonIds.size / totalLessons) * 100) : 0
  const aggMaterialsPct =
    totalMaterials > 0 ? Math.round((accessedMaterialIds.size / totalMaterials) * 100) : 0
  const aggAssignmentsPct =
    totalQuizzes > 0 ? Math.round((completedQuizIds.size / totalQuizzes) * 100) : 0
  const aggExamsPct =
    totalExams > 0 ? Math.round((completedExamIds.size / totalExams) * 100) : 0

  const hasFinishedContent =
    completedLessonIds.size > 0 || completedQuizIds.size > 0 || completedExamIds.size > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero */}
          <div className="bg-gradient-to-r from-deep-teal via-soft-mint/80 to-success-green rounded-3xl p-10 text-white shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-[100px]" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {profile.full_name}!</h1>
                <p className="text-white/90 text-lg mb-4">Continue your learning journey</p>
                {coursesForSwitcher.length > 0 && (
                  <div className="mt-4">
                    <ClassroomSwitcher classrooms={coursesForSwitcher} />
                  </div>
                )}
              </div>
              <Button size="lg" className="bg-white text-deep-teal hover:bg-white/90 shadow-sm hover:shadow transition-all duration-300 rounded-xl h-12 font-medium" asChild>
                <Link href="/dashboard/student/browse-courses">
                  <Plus className="h-5 w-5 mr-2" />
                  Browse Courses
                </Link>
              </Button>
            </div>
          </div>

          {/* Per-course sections */}
          {courseSections.map((section) => (
            <div key={section.course.id}>
              <h2 className="text-xl font-semibold text-deep-teal mb-2">{section.course.name}</h2>
              <p className="text-slate-blue text-sm mb-4">
                {section.course.subject && `${section.course.subject} · `}
                Teacher: {section.course.teacher?.full_name ?? "Unknown"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href={`/dashboard/student/classroom/${section.course.id}`}>
                  <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-bl-[80px]" />
                    <CardContent className="p-6 flex flex-col h-full relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                          <Video className="h-7 w-7 text-orange-600" />
                        </div>
                        {section.lessons.length > 0 && (
                          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center shadow-lg">
                            {section.lessons.length}
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">Video Lectures</h3>
                      <p className="text-sm text-gray-600 mb-4 flex-1">
                        {section.lessons.length} lesson{section.lessons.length !== 1 ? "s" : ""} available
                      </p>
                      <div className="pt-4 border-t space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-semibold text-orange-600">{section.lessonsProgress}%</span>
                        </div>
                        <div className="flex justify-center">
                          <div className="w-full max-w-[140px]">
                            <div className="bg-gray-200 rounded-full h-1.5">
                              <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${section.lessonsProgress}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href={`/dashboard/student/classroom/${section.course.id}`}>
                  <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-transparent rounded-bl-[80px]" />
                    <CardContent className="p-6 flex flex-col h-full relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                          <File className="h-7 w-7 text-purple-600" />
                        </div>
                        {section.materials.length > 0 && (
                          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center shadow-lg">
                            {section.materials.length}
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Course Materials</h3>
                      <p className="text-sm text-gray-600 mb-4 flex-1">
                        {section.materials.length} material{section.materials.length !== 1 ? "s" : ""} available
                      </p>
                      <div className="pt-4 border-t space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-semibold text-purple-600">{section.materialsProgress}%</span>
                        </div>
                        <div className="flex justify-center">
                          <div className="w-full max-w-[140px]">
                            <div className="bg-gray-200 rounded-full h-1.5">
                              <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${section.materialsProgress}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href={`/dashboard/student/classroom/${section.course.id}`}>
                  <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-[80px]" />
                    <CardContent className="p-6 flex flex-col h-full relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                          <GraduationCap className="h-7 w-7 text-blue-600" />
                        </div>
                        {section.exams.length > 0 && (
                          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center shadow-lg">
                            {section.exams.length}
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Exams</h3>
                      <p className="text-sm text-gray-600 mb-4 flex-1">
                        {section.exams.length} exam{section.exams.length !== 1 ? "s" : ""} available
                      </p>
                      <div className="pt-4 border-t space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-semibold text-blue-600">{section.examsProgress}%</span>
                        </div>
                        <div className="flex justify-center">
                          <div className="w-full max-w-[140px]">
                            <div className="bg-gray-200 rounded-full h-1.5">
                              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${section.examsProgress}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href={`/dashboard/student/classroom/${section.course.id}`}>
                  <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/5 to-transparent rounded-bl-[80px]" />
                    <CardContent className="p-6 flex flex-col h-full relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                          <FileText className="h-7 w-7 text-green-600" />
                        </div>
                        {section.quizzes.length > 0 && (
                          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center shadow-lg">
                            {section.quizzes.length}
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Electronic Assignments</h3>
                      <p className="text-sm text-gray-600 mb-4 flex-1">
                        {section.quizzes.length} assignment{section.quizzes.length !== 1 ? "s" : ""} available
                      </p>
                      <div className="pt-4 border-t space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-semibold text-green-600">{section.assignmentsProgress}%</span>
                        </div>
                        <div className="flex justify-center">
                          <div className="w-full max-w-[140px]">
                            <div className="bg-gray-200 rounded-full h-1.5">
                              <div className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${section.assignmentsProgress}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          ))}

          {/* Leave Testimonial */}
          {hasFinishedContent && (
            <Link href="/dashboard/student/leave-testimonial">
              <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success-green/10 to-transparent rounded-bl-[80px]" />
                <CardContent className="p-6 flex flex-col h-full relative">
                  <div className="p-4 bg-gradient-to-br from-success-green/20 to-success-green/5 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                    <Quote className="h-7 w-7 text-success-green" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-success-green transition-colors mt-4">Leave a testimonial</h3>
                  <p className="text-sm text-gray-600 flex-1">Share your experience (students only)</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Overall Course Progress - percentage only, at bottom */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl bg-gradient-to-br from-white to-blue-50/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-deep-teal flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Overall Course Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(avgScore > 0 || overallProgress > 0) && (
                  <div className="flex items-center justify-between gap-4">
                    {avgScore > 0 && (
                      <div className="flex items-center gap-2 text-success-green">
                        <Award className="h-5 w-5" />
                        <span className="text-sm font-medium">Average score</span>
                        <span className="text-xl font-bold">{avgScore}%</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Overall</span>
                  <span className="text-xl font-bold text-deep-teal">{overallProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-deep-teal to-success-green h-3 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Lessons</span>
                      <span className="font-semibold text-orange-600">{aggLessonsPct}%</span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${aggLessonsPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Materials</span>
                      <span className="font-semibold text-purple-600">{aggMaterialsPct}%</span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${aggMaterialsPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Assignments</span>
                      <span className="font-semibold text-green-600">{aggAssignmentsPct}%</span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${aggAssignmentsPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Exams</span>
                      <span className="font-semibold text-blue-600">{aggExamsPct}%</span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${aggExamsPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
