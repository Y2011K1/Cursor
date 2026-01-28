import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, BookOpen, BarChart3, TrendingUp, CheckCircle2, Award, User, File, Trophy, FileText } from "lucide-react"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import { calculateRank, calculateTotalPoints } from "@/lib/ranking"
import { ProgressBarDialog } from "@/components/progress-bar-dialog"

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
    supabase.from("classrooms").select("id", { count: "exact" }).eq("is_active", true),
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

  // Calculate average scores
  const [quizScoresResult, examScoresResult] = await Promise.all([
    supabase
      .from("quiz_submissions")
      .select("score, total_points")
      .eq("is_completed", true)
      .not("score", "is", null)
      .not("total_points", "is", null),
    supabase
      .from("exam_submissions")
      .select("score, total_points")
      .eq("is_completed", true)
      .not("score", "is", null)
      .not("total_points", "is", null),
  ])

  const quizScores = quizScoresResult.data || []
  const examScores = examScoresResult.data || []
  
  // Calculate average quiz score
  const avgQuizScore = quizScores.length > 0
    ? Math.round(
        quizScores.reduce((sum, s) => {
          const percentage = s.total_points > 0 ? ((s.score || 0) / s.total_points) * 100 : 0
          return sum + percentage
        }, 0) / quizScores.length
      )
    : 0
  
  // Calculate average exam score
  const avgExamScore = examScores.length > 0
    ? Math.round(
        examScores.reduce((sum, s) => {
          const percentage = s.total_points > 0 ? ((s.score || 0) / s.total_points) * 100 : 0
          return sum + percentage
        }, 0) / examScores.length
      )
    : 0

  // Calculate overall average score
  const allScores = [...quizScores, ...examScores]
  const overallAvgScore = allScores.length > 0
    ? Math.round(
        allScores.reduce((sum, s) => {
          const percentage = s.total_points > 0 ? ((s.score || 0) / s.total_points) * 100 : 0
          return sum + percentage
        }, 0) / allScores.length
      )
    : 0

  // Get individual student progress
  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "student")
    .order("full_name", { ascending: true })

  const studentIds = students?.map((s) => s.id) || []

  // Get progress for each student (with material access)
  const materialIds = materialsResult.data?.map((m: any) => m.id) || []
  const [studentLessonProgress, studentQuizSubmissions, studentExamSubmissions, studentMaterialAccess] = await Promise.all([
    studentIds.length > 0
      ? supabase
          .from("lesson_progress")
          .select("student_id, is_completed")
          .in("student_id", studentIds)
          .eq("is_completed", true)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length > 0
      ? supabase
          .from("quiz_submissions")
          .select("student_id, score, total_points, is_completed")
          .in("student_id", studentIds)
          .eq("is_completed", true)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length > 0
      ? supabase
          .from("exam_submissions")
          .select("student_id, score, total_points, is_completed")
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

  // Calculate individual student progress with ranking
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

  students?.forEach((student) => {
    const studentLessons = (studentLessonProgress.data || []).filter((p) => p.student_id === student.id)
    const studentQuizzes = (studentQuizSubmissions.data || []).filter((s) => s.student_id === student.id)
    const studentExams = (studentExamSubmissions.data || []).filter((s) => s.student_id === student.id)
    const studentMaterials = (studentMaterialAccess.data || []).filter((m) => m.student_id === student.id)

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

    // Calculate average score for this student
    const studentScores = [...studentQuizzes, ...studentExams]
    const avgScore = studentScores.length > 0
      ? Math.round(
          studentScores.reduce((sum, s) => {
            const percentage = s.total_points > 0 ? ((s.score || 0) / s.total_points) * 100 : 0
            return sum + percentage
          }, 0) / studentScores.length
        )
      : 0

    // Calculate total progress percentage
    const studentTotalContent = totalLessons + totalQuizzes + totalExams
    const studentTotalCompleted = lessonsCompleted + assignmentsCompleted + examsCompleted
    const totalProgress = studentTotalContent > 0
      ? Math.round((studentTotalCompleted / studentTotalContent) * 100)
      : 0

    studentProgressMap.set(student.id, {
      name: student.full_name,
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

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="admin" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="bg-gradient-to-r from-deep-teal/10 to-soft-mint/10 rounded-lg p-6 border border-deep-teal/20">
            <h1 className="text-3xl font-bold text-deep-teal mb-2">
              Admin Dashboard
            </h1>
            <p className="text-slate-blue text-lg">
              Welcome back, {profile.full_name}
            </p>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-blue">
                Total Teachers
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-deep-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-deep-teal">{totalTeachers}</div>
              <p className="text-xs text-slate-blue mt-1">
                Active teachers
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-blue">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-deep-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-deep-teal">{totalStudents}</div>
              <p className="text-xs text-slate-blue mt-1">
                Registered students
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-blue">
                Active Classrooms
              </CardTitle>
              <BookOpen className="h-4 w-4 text-deep-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-deep-teal">{totalClassrooms}</div>
              <p className="text-xs text-slate-blue mt-1">
                Published classrooms
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-blue">
                Total Enrollments
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-deep-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-deep-teal">{totalEnrollments}</div>
              <p className="text-xs text-slate-blue mt-1">
                Student enrollments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Statistics */}
        <Card className="border-0 shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-deep-teal flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Content Overview
            </CardTitle>
            <CardDescription>
              Published content statistics across all classrooms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-light-sky rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-deep-teal" />
                  <span className="text-sm text-slate-blue">Lessons</span>
                </div>
                <div className="text-2xl font-bold text-deep-teal">{totalLessons}</div>
                <div className="text-xs text-slate-blue mt-1">
                  {completedLessons} completed
                </div>
              </div>
              <div className="p-4 bg-light-sky rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-deep-teal" />
                  <span className="text-sm text-slate-blue">Quizzes</span>
                </div>
                <div className="text-2xl font-bold text-deep-teal">{totalQuizzes}</div>
                <div className="text-xs text-slate-blue mt-1">
                  {completedQuizzes} completed
                </div>
              </div>
              <div className="p-4 bg-light-sky rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-4 w-4 text-deep-teal" />
                  <span className="text-sm text-slate-blue">Exams</span>
                </div>
                <div className="text-2xl font-bold text-deep-teal">{totalExams}</div>
                <div className="text-xs text-slate-blue mt-1">
                  {completedExams} completed
                </div>
              </div>
              <div className="p-4 bg-light-sky rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <File className="h-4 w-4 text-deep-teal" />
                  <span className="text-sm text-slate-blue">Materials</span>
                </div>
                <div className="text-2xl font-bold text-deep-teal">{totalMaterials}</div>
                <div className="text-xs text-slate-blue mt-1">
                  Published
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions and Platform Insights - Reordered */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-deep-teal flex items-center gap-2">
                <Users className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Manage teachers and students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/admin/teachers" className="block">
                <Button className="w-full bg-deep-teal hover:bg-deep-teal/90 h-12 text-base">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Manage Teachers
                </Button>
              </Link>
              <Link href="/dashboard/admin/students" className="block">
                <Button className="w-full bg-soft-mint hover:bg-soft-mint/80 text-dark-text h-12 text-base" variant="outline">
                  <Users className="h-5 w-5 mr-2" />
                  Manage Students
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-deep-teal flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Key performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-light-sky rounded-lg">
                  <span className="text-slate-blue">Average Quiz Score</span>
                  <span className="font-bold text-lg text-deep-teal">{avgQuizScore}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-light-sky rounded-lg">
                  <span className="text-slate-blue">Average Exam Score</span>
                  <span className="font-bold text-lg text-deep-teal">{avgExamScore}%</span>
                </div>
                {overallAvgScore > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-slate-blue mb-1">Overall Average Score</div>
                    <div className="text-lg font-bold text-deep-teal">
                      {overallAvgScore}%
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Individual Student Progress Card */}
        <Card className="border-0 shadow-md">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg text-deep-teal flex items-center gap-2">
              <User className="h-4 w-4" />
              Individual Student Progress
            </CardTitle>
            <CardDescription className="text-xs">
              Detailed progress breakdown for each student
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {studentProgressList.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
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
                <p>No student progress data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
