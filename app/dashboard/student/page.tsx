import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText, Award, Plus, PlayCircle, Video, GraduationCap, File, TrendingUp, Trophy } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ClassroomSwitcher } from "@/components/classroom-switcher"
import { unstable_noStore as noStore } from "next/cache"
import { calculateRank, calculateTotalPoints } from "@/lib/ranking"
import { ProgressBarDialog } from "@/components/progress-bar-dialog"

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StudentDashboardPage() {
  noStore() // Prevent caching
  const profile = await requireRole("student")
  const supabase = await createClient()

  // Get student's enrollments with classroom details
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
      classroom:classrooms!inner (
        id,
        name,
        subject,
        is_active,
        teacher:profiles!classrooms_teacher_id_fkey (
          id,
          full_name
        )
      )
    `)
    .eq("student_id", profile.id)
    .eq("is_active", true)
  
  // Filter out enrollments with inactive classrooms
  const activeEnrollments = enrollments?.filter((e: any) => e.classroom?.is_active === true) || []
  const classroomIds = activeEnrollments?.map((e: any) => e.classroom?.id).filter(Boolean) || []
  
  // If no classrooms, show empty state
  if (classroomIds.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-sky via-white to-light-sky">
        <Navigation userRole="student" userName={profile.full_name} />
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-deep-teal/10 mb-4">
                <BookOpen className="h-10 w-10 text-deep-teal" />
              </div>
              <h1 className="text-4xl font-bold text-deep-teal mb-2">
                Welcome, {profile.full_name}!
              </h1>
              <p className="text-lg text-slate-blue">
                Start your learning journey by joining a classroom
              </p>
            </div>
            <Card className="border-0 shadow-lg max-w-2xl mx-auto bg-white">
              <CardContent className="p-8 text-center">
                <p className="text-slate-blue mb-6">
                  Browse available classrooms and join one to start learning.
                </p>
                <Button size="lg" className="bg-deep-teal hover:bg-deep-teal/90 text-white px-8" asChild>
                  <Link href="/dashboard/student/browse">
                    <Plus className="h-5 w-5 mr-2" />
                    Browse Classrooms
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Get all content in parallel - RLS will filter by enrollment
  // Using inner join with classrooms to ensure RLS policies work correctly
  // Matching the structure used in the assignments/exams/lessons pages
  const [lessonsResult, quizzesResult, examsResult, materialsResult] = await Promise.all([
    supabase
      .from("lessons")
      .select(`
        *,
        classroom:classrooms!inner (
          id,
          name,
          subject
        )
      `)
      .eq("is_published", true),
    supabase
      .from("quizzes")
      .select(`
        *,
        classroom:classrooms!inner (
          id,
          name,
          subject
        )
      `)
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("exams")
      .select(`
        *,
        classroom:classrooms!inner (
          id,
          name,
          subject
        )
      `)
      .eq("is_published", true),
    supabase
      .from("course_materials")
      .select(`
        *,
        classroom:classrooms!inner (
          id,
          name,
          subject
        )
      `)
      .eq("is_published", true)
  ])

  const lessons = lessonsResult.data || []
  const quizzes = quizzesResult.data || []
  const exams = examsResult.data || []
  const materials = materialsResult.data || []

  const lessonIds = (lessons || []).map((l) => l.id)
  const quizIds = (quizzes || []).map((q) => q.id)
  const examIds = (exams || []).map((e) => e.id)
  const materialIds = (materials || []).map((m) => m.id)

  // Get progress data
  const [lessonProgressResult, completedQuizzesResult, completedExamsResult, materialAccessResult] = await Promise.all([
    lessonIds.length > 0
      ? supabase
          .from("lesson_progress")
          .select("lesson_id, is_completed")
          .eq("student_id", profile.id)
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [], error: null }),
    quizIds.length > 0
      ? supabase
          .from("quiz_submissions")
          .select("quiz_id, score, total_points, is_completed")
          .eq("student_id", profile.id)
          .eq("is_completed", true)
          .in("quiz_id", quizIds)
      : Promise.resolve({ data: [], error: null }),
    examIds.length > 0
      ? supabase
          .from("exam_submissions")
          .select("exam_id, score, total_points, is_completed")
          .eq("student_id", profile.id)
          .eq("is_completed", true)
          .in("exam_id", examIds)
      : Promise.resolve({ data: [], error: null }),
    materialIds.length > 0
      ? supabase
          .from("material_access")
          .select("material_id")
          .eq("student_id", profile.id)
          .in("material_id", materialIds)
      : Promise.resolve({ data: [], error: null })
  ])
  
  const lessonProgress = (lessonProgressResult.data || [])
  const completedQuizzes = (completedQuizzesResult.data || [])
  const completedExams = (completedExamsResult.data || [])
  const materialAccess = (materialAccessResult.data || [])

  // Calculate progress percentages
  const completedLessons = lessonProgress.filter((p) => p.is_completed).length
  const completedMaterials = materialAccess.length
  const lessonsProgress = lessons.length > 0 
    ? Math.round((completedLessons / lessons.length) * 100) 
    : 0
  
  const assignmentsProgress = quizzes.length > 0
    ? Math.round((completedQuizzes.length / quizzes.length) * 100)
    : 0

  const examsProgress = exams.length > 0
    ? Math.round((completedExams.length / exams.length) * 100)
    : 0

  // Materials progress based on access
  const materialsProgress = materials.length > 0
    ? Math.round((completedMaterials / materials.length) * 100)
    : 0

  // Calculate total points for ranking system
  // Points come from:
  // - Lessons: 1 point each (completedLessons)
  // - Materials: 1 point each (completedMaterials)
  // - Assignments: 2 points each (completedAssignments)
  // - Exams: 2 points each (completedExams)
  const completedAssignments = completedQuizzes.length
  const completedExamsCount = completedExams.length

  // Calculate average score from completed quizzes and exams
  const allScores = [...completedQuizzes, ...completedExams]
  const avgScore = allScores.length > 0
    ? Math.round(
        allScores.reduce((sum, s) => {
          const percentage = s.total_points > 0 ? ((s.score || 0) / s.total_points) * 100 : 0
          return sum + percentage
        }, 0) / allScores.length
      )
    : 0

  // Calculate total points
  const totalPoints = calculateTotalPoints({
    completedLessons,
    completedMaterials,
    completedAssignments,
    completedExams: completedExamsCount,
  })

  // Calculate ranking
  const ranking = calculateRank(totalPoints)

  // Calculate overall progress (weighted average)
  const totalItems = lessons.length + quizzes.length + exams.length
  const completedItems = completedLessons + completedQuizzes.length + completedExams.length
  const overallProgress = totalItems > 0 
    ? Math.round((completedItems / totalItems) * 100)
    : 0

  // Count pending/upcoming items for badges
  const now = new Date()
  const upcomingQuizzes = quizzes.filter((q: any) => {
    if (!q.due_date) return false
    const dueDate = new Date(q.due_date)
    return dueDate >= now
  })
  const upcomingExams = exams.filter((e: any) => {
    if (!e.due_date) return false
    const dueDate = new Date(e.due_date)
    return dueDate >= now
  })
  
  // Calculate pending items for badges (show count of available items)
  const pendingLessons = lessons.length - completedLessons
  const pendingAssignments = quizzes.length - completedQuizzes.length
  const pendingExams = exams.length - completedExams.length

  // Prepare classrooms for switcher
  const classroomsForSwitcher = activeEnrollments.map((e: any) => ({
    id: e.classroom.id,
    name: e.classroom.name,
    subject: e.classroom.subject
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-sky via-white to-light-sky flex flex-col">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section with Classroom Switcher */}
          <div className="bg-gradient-to-r from-deep-teal to-soft-mint rounded-2xl p-6 md:p-8 text-white shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Welcome back, {profile.full_name}!
                </h1>
                <p className="text-white/90 text-lg mb-4">
                  Continue your learning journey
                </p>
                {classroomsForSwitcher.length > 0 && (
                  <div className="mt-4">
                    <ClassroomSwitcher classrooms={classroomsForSwitcher} />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  size="lg" 
                  className="bg-white text-deep-teal hover:bg-white/90 shadow-md" 
                  asChild
                >
                  <Link href="/dashboard/student/browse">
                    <Plus className="h-5 w-5 mr-2" />
                    Browse Classrooms
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Ranking System Section */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-deep-teal flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Student Level: {ranking.icon} {ranking.rank}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="text-2xl font-bold text-deep-teal">{totalPoints} pts</div>
                    <div className="text-sm text-slate-blue">Total Points</div>
                  </div>
                  {avgScore > 0 && (
                    <div className="flex flex-col items-end">
                      <div className="text-xl font-bold text-success-green flex items-center gap-1">
                        <Award className="h-5 w-5" />
                        {avgScore}%
                      </div>
                      <div className="text-sm text-slate-blue">Average Score</div>
                    </div>
                  )}
                </div>
                {ranking.nextRankPoints && (() => {
                  const currentThreshold = ranking.rank === "Bronze" ? 0 : ranking.rank === "Silver" ? 50 : ranking.rank === "Gold" ? 150 : 300
                  const pointsNeeded = ranking.nextRankPoints - totalPoints
                  const pointsInCurrentRank = totalPoints - currentThreshold
                  const pointsForNextRank = ranking.nextRankPoints - currentThreshold
                  const nextRankName = ranking.nextRankPoints === 50 ? "Silver" : ranking.nextRankPoints === 150 ? "Gold" : "Platinum"
                  const nextRankIcon = ranking.nextRankPoints === 50 ? "🥈" : ranking.nextRankPoints === 150 ? "🥇" : "💎"
                  const progressPercent = Math.min(100, Math.max(0, (pointsInCurrentRank / pointsForNextRank) * 100))
                  
                  return (
                    <div className="pt-3 border-t border-gray-200 space-y-3">
                      <div className="text-sm font-semibold text-deep-teal">
                        Next Level: {nextRankName}
                      </div>
                      <ProgressBarDialog
                        lessonsCompleted={completedLessons}
                        materialsCompleted={completedMaterials}
                        assignmentsCompleted={completedAssignments}
                        examsCompleted={completedExamsCount}
                      >
                        <div className="flex items-center gap-2 text-xs text-slate-blue">
                          <span className="font-medium">{ranking.rank}</span>
                          <div className="flex-1 relative">
                            <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
                              <div
                                className="bg-deep-teal h-5 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                          <span className="font-medium flex items-center gap-1">
                            {nextRankName} {nextRankIcon}
                          </span>
                        </div>
                      </ProgressBarDialog>
                      <div className="text-xs text-slate-blue">
                        {pointsInCurrentRank} / {pointsForNextRank} points
                      </div>
                      {pointsNeeded > 0 && (
                        <div className="text-xs text-slate-blue">
                          {pointsNeeded} more {pointsNeeded === 1 ? 'point' : 'points'} to reach {nextRankName}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Main Category Cards - Matching the Image Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Video Lectures Card */}
            <Link href="/dashboard/student/video-lectures">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white cursor-pointer group h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Video className="h-6 w-6 text-orange-600" />
                    </div>
                    {lessons.length > 0 && (
                      <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {lessons.length}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-deep-teal mb-2 group-hover:text-deep-teal/80 transition-colors">
                    Video Lectures
                  </h3>
                  <p className="text-sm text-slate-blue mb-4 flex-1">
                    {lessons.length} lesson{lessons.length !== 1 ? "s" : ""} available
                  </p>
                  <div className="mt-auto">
                    <p className="text-xs text-slate-blue mt-2">
                      {completedLessons} completed
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Course Materials Card */}
            <Link href="/dashboard/student/course-materials">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white cursor-pointer group h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <File className="h-6 w-6 text-purple-600" />
                    </div>
                    {materials.length > 0 && (
                      <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {materials.length}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-deep-teal mb-2 group-hover:text-deep-teal/80 transition-colors">
                    Course Materials
                  </h3>
                  <p className="text-sm text-slate-blue mb-4 flex-1">
                    {materials.length} material{materials.length !== 1 ? "s" : ""} available
                  </p>
                  <div className="mt-auto">
                    <p className="text-xs text-slate-blue mt-2">
                      {completedMaterials} accessed
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Exams Card */}
            <Link href="/dashboard/student/exams">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white cursor-pointer group h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                    </div>
                    {exams.length > 0 && (
                      <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {exams.length}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-deep-teal mb-2 group-hover:text-deep-teal/80 transition-colors">
                    Exams
                  </h3>
                  <p className="text-sm text-slate-blue mb-4 flex-1">
                    {exams.length} exam{exams.length !== 1 ? "s" : ""} available
                  </p>
                  <div className="mt-auto">
                    <p className="text-xs text-slate-blue mt-2">
                      {completedExams.length} completed
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Electronic Assignments Card */}
            <Link href="/dashboard/student/assignments">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white cursor-pointer group h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    {quizzes.length > 0 && (
                      <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {quizzes.length}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-deep-teal mb-2 group-hover:text-deep-teal/80 transition-colors">
                    Electronic Assignments
                  </h3>
                  <p className="text-sm text-slate-blue mb-4 flex-1">
                    {quizzes.length} assignment{quizzes.length !== 1 ? "s" : ""} available
                  </p>
                  <div className="mt-auto">
                    <p className="text-xs text-slate-blue mt-2">
                      {completedQuizzes.length} completed
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
