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
import nextDynamic from "next/dynamic"

// Lazy load ProgressBarDialog
const ProgressBarDialog = nextDynamic(() => import("@/components/progress-bar-dialog").then(mod => ({ default: mod.ProgressBarDialog })), {
  loading: () => null,
})

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
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl max-w-2xl mx-auto bg-gradient-to-br from-white to-blue-50/50">
              <CardContent className="p-8 text-center">
                <p className="text-slate-blue mb-6">
                  Browse available classrooms and join one to start learning.
                </p>
                <Button size="lg" className="bg-deep-teal hover:bg-deep-teal/90 text-white px-8 rounded-xl h-12 shadow-sm hover:shadow transition-all duration-300 font-medium" asChild>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-deep-teal via-soft-mint/80 to-success-green rounded-3xl p-10 text-white shadow-xl overflow-hidden relative">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-[100px]"></div>
            
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                  className="bg-white text-deep-teal hover:bg-white/90 shadow-sm hover:shadow transition-all duration-300 rounded-xl h-12 font-medium" 
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
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl bg-gradient-to-br from-white to-blue-50/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-deep-teal flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Student Level: {ranking.icon} {ranking.rank}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="text-2xl font-bold text-deep-teal">{totalPoints} pts</div>
                    <div className="text-sm font-medium text-slate-600">Total Points</div>
                  </div>
                  {avgScore > 0 && (
                    <div className="flex flex-col items-end">
                      <div className="text-xl font-bold text-success-green flex items-center gap-1">
                        <Award className="h-5 w-5" />
                        {avgScore}%
                      </div>
                      <div className="text-sm font-medium text-slate-600">Average Score</div>
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
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="font-medium">{ranking.rank}</span>
                          {/* SHORTER PROGRESS BAR with max-w-sm */}
                          <div className="flex-1 max-w-sm relative">
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-deep-teal to-success-green h-2.5 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                          <span className="font-medium flex items-center gap-1">
                            {nextRankName} {nextRankIcon}
                          </span>
                        </div>
                      </ProgressBarDialog>
                      <div className="text-xs text-slate-600">
                        {pointsInCurrentRank} / {pointsForNextRank} points
                      </div>
                      {pointsNeeded > 0 && (
                        <div className="text-xs text-slate-600">
                          {pointsNeeded} more {pointsNeeded === 1 ? 'point' : 'points'} to reach {nextRankName}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Main Category Cards - Color-Coded */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Video Lectures Card - Orange */}
            <Link href="/dashboard/student/video-lectures">
              <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-bl-[80px]"></div>
                
                <CardContent className="p-6 flex flex-col h-full relative">
                  <div className="flex items-start justify-between mb-4">
                    {/* Icon with scale animation */}
                    <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                      <Video className="h-7 w-7 text-orange-600" />
                    </div>
                    
                    {/* Notification badge */}
                    {lessons.length > 0 && (
                      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-xl w-8 h-8 flex items-center justify-center shadow-lg">
                        {lessons.length}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                    Video Lectures
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {lessons.length} lesson{lessons.length !== 1 ? "s" : ""} available
                  </p>
                  
                  {/* SHORTER PROGRESS UNDER CONTENT - max-w-[140px] */}
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Completed</span>
                      <span className="font-semibold text-orange-600">{completedLessons}/{lessons.length}</span>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-full max-w-[140px]">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-1.5 rounded-full transition-all duration-700 ease-out" 
                            style={{ width: `${lessonsProgress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Course Materials Card - Purple */}
            <Link href="/dashboard/student/course-materials">
              <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-transparent rounded-bl-[80px]"></div>
                
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
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    Course Materials
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {materials.length} material{materials.length !== 1 ? "s" : ""} available
                  </p>
                  
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Accessed</span>
                      <span className="font-semibold text-purple-600">{completedMaterials}/{materials.length}</span>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-full max-w-[140px]">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 rounded-full transition-all duration-700 ease-out" 
                            style={{ width: `${materialsProgress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Exams Card - Blue */}
            <Link href="/dashboard/student/exams">
              <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-[80px]"></div>
                
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
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    Exams
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {exams.length} exam{exams.length !== 1 ? "s" : ""} available
                  </p>
                  
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Completed</span>
                      <span className="font-semibold text-blue-600">{completedExams.length}/{exams.length}</span>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-full max-w-[140px]">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-700 ease-out" 
                            style={{ width: `${examsProgress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Electronic Assignments Card - Green */}
            <Link href="/dashboard/student/assignments">
              <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden cursor-pointer group h-full relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/5 to-transparent rounded-bl-[80px]"></div>
                
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
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                    Electronic Assignments
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {quizzes.length} assignment{quizzes.length !== 1 ? "s" : ""} available
                  </p>
                  
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Completed</span>
                      <span className="font-semibold text-green-600">{completedQuizzes.length}/{quizzes.length}</span>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-full max-w-[140px]">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-700 ease-out" 
                            style={{ width: `${assignmentsProgress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
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
