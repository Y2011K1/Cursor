import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { FileText, ArrowLeft, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AssignmentsPage() {
  noStore() // Prevent caching
  const profile = await requireRole("student")
  const supabase = await createClient()

  // Get student's enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
      classroom:classrooms!inner (
        id,
        name,
        subject,
        is_active
      )
    `)
    .eq("student_id", profile.id)
    .eq("is_active", true)
  
  const activeEnrollments = enrollments?.filter((e: any) => e.classroom?.is_active === true) || []
  const classroomIds = activeEnrollments?.map((e: any) => e.classroom?.id).filter(Boolean) || []

  // Get all quizzes (assignments) - RLS will filter by enrollment
  const { data: quizzes, error: quizzesError } = await supabase
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
    .order("created_at", { ascending: false })

  if (quizzesError) {
    console.error("Error fetching quizzes:", quizzesError)
  }

  const quizIds = quizzes?.map((q) => q.id) || []
  const { data: submissions } = quizIds.length > 0
    ? await supabase
        .from("quiz_submissions")
        .select("quiz_id, is_completed, score, total_points")
        .eq("student_id", profile.id)
        .eq("is_completed", true)
        .in("quiz_id", quizIds)
    : { data: [] }

  const submissionMap = new Map<string, any>()
  submissions?.forEach((s) => {
    submissionMap.set(s.quiz_id, s)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-sky via-white to-light-sky flex flex-col">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/student">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-deep-teal flex items-center gap-2">
                <FileText className="h-8 w-8" />
                Electronic Assignments
              </h1>
              <p className="text-slate-blue mt-1">
                {quizzes?.length || 0} assignment{quizzes?.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>

          {quizzes && quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz: any) => {
                const submission = submissionMap.get(quiz.id)
                const isCompleted = submission?.is_completed || false
                const classroom = quiz.classroom
                
                return (
                  <Card 
                    key={quiz.id}
                    className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white group"
                  >
                    <Link href={`/dashboard/student/course/${quiz.classroom_id}/quiz/${quiz.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <FileText className="h-5 w-5 text-green-600" />
                          </div>
                          {isCompleted && (
                            <CheckCircle2 className="h-5 w-5 text-success-green flex-shrink-0" />
                          )}
                        </div>
                        <CardTitle className="text-lg text-deep-teal group-hover:text-deep-teal/80 transition-colors mb-1">
                          {quiz.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {classroom?.name} • {classroom?.subject}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {quiz.description && (
                          <p className="text-sm text-slate-blue line-clamp-2">
                            {quiz.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-blue">
                          {quiz.time_limit_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {quiz.time_limit_minutes} min
                            </span>
                          )}
                          <span>Max {quiz.max_attempts} attempt{quiz.max_attempts > 1 ? 's' : ''}</span>
                        </div>
                        {isCompleted && submission && (
                          <div className="p-2 bg-success-green/10 rounded text-xs">
                            <span className="text-success-green font-semibold">
                              Score: {submission.score}/{submission.total_points} ({Math.round((submission.score / submission.total_points) * 100)}%)
                            </span>
                          </div>
                        )}
                        <Button 
                          className="w-full bg-green-500 hover:bg-green-600 text-white" 
                          size="sm"
                        >
                          {isCompleted ? 'View Results' : 'Take Assignment'}
                        </Button>
                      </CardContent>
                    </Link>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-slate-blue/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-deep-teal mb-2">No Assignments</h3>
                <p className="text-slate-blue">
                  No assignments are available at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
