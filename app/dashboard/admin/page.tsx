import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, BookOpen, BarChart3, TrendingUp, CheckCircle2, Award, User, File, Trophy, FileText, Layout, Newspaper } from "lucide-react"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import { calculateTotalPoints } from "@/lib/ranking"
// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminDashboardPage() {
  noStore() // Prevent caching
  const profile = await requireRole("admin")
  const supabase = await createClient()

  // Get real statistics
  const [teachersResult, studentsResult, classroomsResult, enrollmentsResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact" }).eq("role", "teacher"),
    supabase.from("profiles").select("id", { count: "exact" }).eq("role", "student"),
    supabase.from("courses").select("id", { count: "exact" }).eq("is_active", true),
    supabase.from("enrollments").select("id", { count: "exact" }).eq("is_active", true),
  ])

  const totalTeachers = teachersResult.count || 0
  const totalStudents = studentsResult.count || 0
  const totalClassrooms = classroomsResult.count || 0
  const totalEnrollments = enrollmentsResult.count || 0

  // Get student progression statistics
  const [lessonsResult, quizzesResult, examsResult, materialsResult, lessonProgressResult, completedQuizzesResult, completedExamsResult] = await Promise.all([
    supabase.from("lessons").select("id", { count: "exact" }).eq("is_published", true),
    supabase.from("quizzes").select("id", { count: "exact" }).eq("is_published", true),
    supabase.from("exams").select("id", { count: "exact" }).eq("is_published", true),
    supabase.from("course_materials").select("id", { count: "exact" }).eq("is_published", true),
    supabase.from("lesson_progress").select("id", { count: "exact" }).eq("is_completed", true),
    supabase.from("quiz_submissions").select("id", { count: "exact" }).eq("is_completed", true),
    supabase.from("exam_submissions").select("id", { count: "exact" }).eq("is_completed", true),
  ])

  const totalLessons = lessonsResult.count || 0
  const totalQuizzes = quizzesResult.count || 0
  const totalExams = examsResult.count || 0
  const totalMaterials = materialsResult.count || 0
  const completedLessons = lessonProgressResult.count || 0
  const completedQuizzes = completedQuizzesResult.count || 0
  const completedExams = completedExamsResult.count || 0

  // Calculate overall progress
  // Materials don't have completion tracking, so exclude them from progress calculation
  const totalContent = totalLessons + totalQuizzes + totalExams
  const totalCompleted = completedLessons + completedQuizzes + completedExams
  const overallProgress = totalContent > 0 ? Math.round((totalCompleted / totalContent) * 100) : 0

  // Get individual student progress
  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "student")
    .order("full_name", { ascending: true })

  const studentIds = students?.map((s) => s.id) || []

  // Active enrollments (student_id, course_id, course name) for per-course progress
  const { data: activeEnrollments } = await supabase
    .from("enrollments")
    .select("student_id, course_id, course:courses(id, name)")
    .eq("is_active", true)
    .in("student_id", studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"])

  // Published content per course (for totals and mapping progress to course)
  const [lessonsByCourseResult, quizzesByCourseResult, examsByCourseResult] = await Promise.all([
    supabase.from("lessons").select("id, course_id").eq("is_published", true),
    supabase.from("quizzes").select("id, course_id").eq("is_published", true),
    supabase.from("exams").select("id, course_id").eq("is_published", true),
  ])
  const lessonsByCourse = lessonsByCourseResult.data || []
  const quizzesByCourse = quizzesByCourseResult.data || []
  const examsByCourse = examsByCourseResult.data || []

  const lessonIdToCourseId = new Map<string, string>()
  const quizIdToCourseId = new Map<string, string>()
  const examIdToCourseId = new Map<string, string>()
  lessonsByCourse.forEach((l: { id: string; course_id: string }) => lessonIdToCourseId.set(l.id, l.course_id))
  quizzesByCourse.forEach((q: { id: string; course_id: string }) => quizIdToCourseId.set(q.id, q.course_id))
  examsByCourse.forEach((e: { id: string; course_id: string }) => examIdToCourseId.set(e.id, e.course_id))

  const courseIdToTotals = new Map<string, { lessons: number; quizzes: number; exams: number }>()
  for (const cid of new Set([...lessonIdToCourseId.values(), ...quizIdToCourseId.values(), ...examIdToCourseId.values()])) {
    courseIdToTotals.set(cid, {
      lessons: lessonsByCourse.filter((l: { course_id: string }) => l.course_id === cid).length,
      quizzes: quizzesByCourse.filter((q: { course_id: string }) => q.course_id === cid).length,
      exams: examsByCourse.filter((e: { course_id: string }) => e.course_id === cid).length,
    })
  }

  // Get progress rows with lesson/quiz/exam ids so we can attribute to course
  const materialIds = materialsResult.data?.map((m: any) => m.id) || []
  const [studentLessonProgress, studentQuizSubmissions, studentExamSubmissions, studentMaterialAccess] = await Promise.all([
    studentIds.length > 0
      ? supabase
          .from("lesson_progress")
          .select("student_id, lesson_id")
          .in("student_id", studentIds)
          .eq("is_completed", true)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length > 0
      ? supabase
          .from("quiz_submissions")
          .select("student_id, quiz_id, score, total_points")
          .in("student_id", studentIds)
          .eq("is_completed", true)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length > 0
      ? supabase
          .from("exam_submissions")
          .select("student_id, exam_id, score, total_points")
          .in("student_id", studentIds)
          .eq("is_completed", true)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length > 0 && materialIds.length > 0
      ? supabase
          .from("material_access")
          .select("student_id, material_id")
          .in("student_id", studentIds)
          .in("material_id", materialIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  type CourseProgress = {
    courseId: string
    courseName: string
    lessonsCompleted: number
    lessonsTotal: number
    assignmentsCompleted: number
    assignmentsTotal: number
    examsCompleted: number
    examsTotal: number
    progressPct: number
    avgScore: number
  }

  // Per-course progress for each student (only active enrollments)
  const studentProgressMap = new Map<string, {
    name: string
    courses: CourseProgress[]
    lessonsCompleted: number
    assignmentsCompleted: number
    examsCompleted: number
    materialsCompleted: number
    materialsCount: number
    avgScore: number
    totalProgress: number
    totalPoints: number
  }>()

  students?.forEach((student) => {
    const studentLessons = (studentLessonProgress.data || []).filter((p: { student_id: string }) => p.student_id === student.id)
    const studentQuizzes = (studentQuizSubmissions.data || []).filter((s: { student_id: string }) => s.student_id === student.id)
    const studentExams = (studentExamSubmissions.data || []).filter((s: { student_id: string }) => s.student_id === student.id)
    const studentMaterials = (studentMaterialAccess.data || []).filter((m: { student_id: string }) => m.student_id === student.id)

    const lessonsCompleted = studentLessons.length
    const assignmentsCompleted = studentQuizzes.length
    const examsCompleted = studentExams.length
    const materialsCompleted = studentMaterials.length

    const totalPoints = calculateTotalPoints({
      completedLessons: lessonsCompleted,
      completedMaterials: materialsCompleted,
      completedAssignments: assignmentsCompleted,
      completedExams: examsCompleted,
    })
    const studentScores = [...studentQuizzes, ...studentExams]
    const avgScore = studentScores.length > 0
      ? Math.round(
          studentScores.reduce((sum: number, s: { score: number | null; total_points: number | null }) => {
            const totalPts = s.total_points ?? 0
            const percentage = totalPts > 0 ? ((s.score ?? 0) / totalPts) * 100 : 0
            return sum + percentage
          }, 0) / studentScores.length
        )
      : 0
    const studentTotalContent = totalLessons + totalQuizzes + totalExams
    const studentTotalCompleted = lessonsCompleted + assignmentsCompleted + examsCompleted
    const totalProgress = studentTotalContent > 0 ? Math.round((studentTotalCompleted / studentTotalContent) * 100) : 0

    // Build per-course progress for this student (only active enrollments)
    const enrollmentsForStudent = (activeEnrollments || []).filter(
      (e: { student_id: string }) => e.student_id === student.id
    ) as unknown as { student_id: string; course_id: string; course: { id: string; name: string } | null }[]
    const courses: CourseProgress[] = enrollmentsForStudent.map((e) => {
      const courseId = e.course_id
      const courseName = (e.course as { id: string; name: string } | null)?.name ?? "Course"
      const totals = courseIdToTotals.get(courseId) ?? { lessons: 0, quizzes: 0, exams: 0 }
      const lessonsTotal = totals.lessons
      const assignmentsTotal = totals.quizzes
      const examsTotal = totals.exams

      const lessonsDone = studentLessons.filter(
        (p: { lesson_id: string }) => lessonIdToCourseId.get(p.lesson_id) === courseId
      ).length
      const quizzesDone = studentQuizzes.filter(
        (s: { quiz_id: string }) => quizIdToCourseId.get(s.quiz_id) === courseId
      ).length
      const examsDone = studentExams.filter(
        (s: { exam_id: string }) => examIdToCourseId.get(s.exam_id) === courseId
      ).length

      const totalInCourse = lessonsTotal + assignmentsTotal + examsTotal
      const completedInCourse = lessonsDone + quizzesDone + examsDone
      const progressPct = totalInCourse > 0 ? Math.round((completedInCourse / totalInCourse) * 100) : 0

      const courseScores = [
        ...studentQuizzes.filter((s: { quiz_id: string }) => quizIdToCourseId.get(s.quiz_id) === courseId),
        ...studentExams.filter((s: { exam_id: string }) => examIdToCourseId.get(s.exam_id) === courseId),
      ]
      const courseAvgScore = courseScores.length > 0
        ? Math.round(
            courseScores.reduce((sum: number, s: { score: number | null; total_points: number | null }) => {
              const totalPts = s.total_points ?? 0
              const pct = totalPts > 0 ? ((s.score ?? 0) / totalPts) * 100 : 0
              return sum + pct
            }, 0) / courseScores.length
          )
        : 0

      return {
        courseId,
        courseName,
        lessonsCompleted: lessonsDone,
        lessonsTotal,
        assignmentsCompleted: quizzesDone,
        assignmentsTotal,
        examsCompleted: examsDone,
        examsTotal,
        progressPct,
        avgScore: courseAvgScore,
      }
    })

    studentProgressMap.set(student.id, {
      name: student.full_name,
      courses,
      lessonsCompleted,
      assignmentsCompleted,
      examsCompleted,
      materialsCompleted,
      materialsCount: totalMaterials,
      avgScore,
      totalProgress,
      totalPoints,
    })
  })

  // List: one entry per student, sorted by total points; each entry has .courses for per-course bars
  const studentProgressList = Array.from(studentProgressMap.entries())
    .map(([studentId, v]) => ({ studentId, ...v }))
    .sort((a, b) => b.totalPoints - a.totalPoints)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Navigation userRole="admin" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-deep-teal via-soft-mint/80 to-success-green rounded-3xl p-10 text-white shadow-xl overflow-hidden relative">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-[100px]"></div>
            
            <div className="relative">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Admin Dashboard
              </h1>
              <p className="text-white/90 text-lg">
                Welcome back, {profile.full_name}
              </p>
            </div>
          </div>

          {/* Summary Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-sm hover:shadow-lg transition-all bg-white overflow-hidden group relative">
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-[100px]"></div>
              
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  {/* Icon with gradient */}
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  
                  {/* Number display */}
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{totalTeachers}</div>
                    <div className="text-xs text-gray-500 mt-1">Active</div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-700">Total Teachers</p>
                  <p className="text-xs text-gray-500">Active teachers on platform</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-lg transition-all bg-white overflow-hidden group relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-[100px]"></div>
              
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
                    <div className="text-xs text-gray-500 mt-1">Registered</div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-700">Total Students</p>
                  <p className="text-xs text-gray-500">Registered students on platform</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-lg transition-all bg-white overflow-hidden group relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-transparent rounded-bl-[100px]"></div>
              
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{totalClassrooms}</div>
                    <div className="text-xs text-gray-500 mt-1">Published</div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-700">Active Classrooms</p>
                  <p className="text-xs text-gray-500">Published classrooms</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-lg transition-all bg-white overflow-hidden group relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/5 to-transparent rounded-bl-[100px]"></div>
              
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{totalEnrollments}</div>
                    <div className="text-xs text-gray-500 mt-1">Total</div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-700">Total Enrollments</p>
                  <p className="text-xs text-gray-500">Student enrollments</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Statistics */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl bg-gradient-to-br from-white to-blue-50/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-deep-teal flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Content Overview
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Published content statistics across all classrooms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Video Lessons</span>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-3xl font-bold text-blue-600">{totalLessons}</p>
                    <p className="text-sm text-gray-500">published</p>
                  </div>
                  
                  {/* SHORTER PROGRESS BAR */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-center">
                      <div className="w-full max-w-[180px] bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-700 ease-out" 
                          style={{ width: `${totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%` }} 
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">{completedLessons} completed</p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-green-50 to-white border border-green-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Quizzes</span>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-3xl font-bold text-green-600">{totalQuizzes}</p>
                    <p className="text-sm text-gray-500">published</p>
                  </div>
                  
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-center">
                      <div className="w-full max-w-[180px] bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-700 ease-out" 
                          style={{ width: `${totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0}%` }} 
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">{completedQuizzes} completed</p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Exams</span>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-3xl font-bold text-purple-600">{totalExams}</p>
                    <p className="text-sm text-gray-500">published</p>
                  </div>
                  
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-center">
                      <div className="w-full max-w-[180px] bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 rounded-full transition-all duration-700 ease-out" 
                          style={{ width: `${totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0}%` }} 
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">{completedExams} completed</p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <File className="h-5 w-5 text-amber-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Materials</span>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-3xl font-bold text-amber-600">{totalMaterials}</p>
                    <p className="text-sm text-gray-500">published</p>
                  </div>
                  
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-center">
                      <div className="w-full max-w-[180px] bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-1.5 rounded-full transition-all duration-700 ease-out" 
                          style={{ width: `100%` }} 
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">All published</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl bg-gradient-to-br from-white to-blue-50/50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-deep-teal flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  Manage teachers and students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/admin/teachers" className="block">
                  <Button className="w-full bg-deep-teal hover:bg-deep-teal/90 rounded-xl h-12 shadow-sm hover:shadow transition-all duration-300 font-medium">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Manage Teachers
                  </Button>
                </Link>
                <Link href="/dashboard/admin/students" className="block">
                  <Button className="w-full bg-soft-mint hover:bg-soft-mint/80 text-dark-text rounded-xl h-12 shadow-sm hover:shadow transition-all duration-300 font-medium" variant="outline">
                    <Users className="h-5 w-5 mr-2" />
                    Manage Students
                  </Button>
                </Link>
                <Link href="/dashboard/admin/landing-page" className="block">
                  <Button className="w-full bg-white border-deep-teal/30 text-deep-teal hover:bg-light-sky rounded-xl h-12 shadow-sm hover:shadow transition-all duration-300 font-medium" variant="outline">
                    <Layout className="h-5 w-5 mr-2" />
                    Landing Page
                  </Button>
                </Link>
                <Link href="/dashboard/admin/blog" className="block">
                  <Button className="w-full bg-white border-deep-teal/30 text-deep-teal hover:bg-light-sky rounded-xl h-12 shadow-sm hover:shadow transition-all duration-300 font-medium" variant="outline">
                    <Newspaper className="h-5 w-5 mr-2" />
                    Blog
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Individual Student Progress Card */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl bg-gradient-to-br from-white to-blue-50/50">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-xl font-bold text-deep-teal flex items-center gap-2">
                <User className="h-5 w-5" />
                Individual Student Progress
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Detailed progress breakdown for each student
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {studentProgressList.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {studentProgressList.map((student, index) => (
                    <div
                      key={student.studentId}
                      className="p-6 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border hover:border-deep-teal/30 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-lg font-bold text-deep-teal">{student.name}</h3>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-deep-teal">{student.totalPoints}</div>
                              <div className="text-xs text-slate-600 mt-0.5">Total Points</div>
                            </div>
                            {student.avgScore > 0 && (
                              <div className="text-center">
                                <div className="text-xl font-bold text-success-green flex items-center justify-center gap-1">
                                  <Award className="h-4 w-4" />
                                  {student.avgScore}%
                                </div>
                                <div className="text-xs text-slate-600 mt-0.5">Avg Score</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Per-course progress bars (only active enrollments; left courses are excluded) */}
                      {student.courses.length > 0 ? (
                        <div className="space-y-3 pt-4 border-t border-gray-200">
                          <div className="text-sm font-semibold text-deep-teal">Progress by course</div>
                          {student.courses.map((course) => (
                            <div key={course.courseId} className="flex flex-col gap-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-slate-700">{course.courseName}</span>
                                <span className="text-slate-600">
                                  {course.progressPct}%
                                  {course.avgScore > 0 && ` · Avg ${course.avgScore}%`}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-deep-teal to-success-green h-2 rounded-full transition-all duration-700 ease-out"
                                  style={{ width: `${course.progressPct}%` }}
                                />
                              </div>
                              <div className="text-xs text-slate-500">
                                {course.lessonsCompleted}/{course.lessonsTotal} lessons · {course.assignmentsCompleted}/{course.assignmentsTotal} quizzes · {course.examsCompleted}/{course.examsTotal} exams
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-gray-200 text-sm text-slate-500">
                          No active course enrollments
                        </div>
                      )}
                      {(() => {
                        const studentRank = (student as { rank?: { nextRankPoints?: number; rank?: string } }).rank
                        if (!studentRank?.nextRankPoints) return null
                        
                        const currentThreshold = studentRank.rank === "Bronze" ? 0 : studentRank.rank === "Silver" ? 50 : studentRank.rank === "Gold" ? 150 : 300
                        const pointsNeeded = studentRank.nextRankPoints - student.totalPoints
                        const pointsInCurrentRank = student.totalPoints - currentThreshold
                        const pointsForNextRank = studentRank.nextRankPoints - currentThreshold
                        const nextRankName = studentRank.nextRankPoints === 50 ? "Silver" : studentRank.nextRankPoints === 150 ? "Gold" : "Platinum"
                        const nextRankIcon = studentRank.nextRankPoints === 50 ? "🥈" : studentRank.nextRankPoints === 150 ? "🥇" : "💎"
                        const progressPercent = Math.min(100, Math.max(0, (pointsInCurrentRank / pointsForNextRank) * 100))
                        
                        return (
                          <div className="space-y-2 pt-4 border-t border-gray-200 mt-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-deep-teal">
                                Next Level: {nextRankName}
                              </div>
                              <div className="text-xs text-slate-600">
                                {pointsInCurrentRank} / {pointsForNextRank} points
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                              <span className="font-medium min-w-[60px]">{studentRank.rank}</span>
                              <div className="flex-1 max-w-[240px] relative group">
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-deep-teal to-success-green h-2.5 rounded-full transition-all duration-700 ease-out relative"
                                    style={{ width: `${progressPercent}%` }}
                                  >
                                    {progressPercent > 15 && (
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
                            {pointsNeeded > 0 && (
                              <div className="text-xs text-slate-600 text-center pt-1">
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
                <div className="text-center py-12 text-slate-600">
                  <User className="h-12 w-12 mx-auto mb-2 text-slate-600/50" />
                  <p className="text-sm">No student progress data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
