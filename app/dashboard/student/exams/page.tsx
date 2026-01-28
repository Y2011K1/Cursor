import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { GraduationCap, ArrowLeft, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ExamsPage() {
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

  // Get all exams - RLS will filter by enrollment
  const { data: exams, error: examsError } = await supabase
    .from("exams")
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

  if (examsError) {
    console.error("Error fetching exams:", examsError)
  }

  const examIds = exams?.map((e) => e.id) || []
  const { data: submissions } = examIds.length > 0
    ? await supabase
        .from("exam_submissions")
        .select("exam_id, is_completed, score, total_points")
        .eq("student_id", profile.id)
        .in("exam_id", examIds)
    : { data: [] }

  const submissionMap = new Map<string, any>()
  submissions?.forEach((s) => {
    submissionMap.set(s.exam_id, s)
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
                <GraduationCap className="h-8 w-8" />
                Exams
              </h1>
              <p className="text-slate-blue mt-1">
                {exams?.length || 0} exam{exams?.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>

          {exams && exams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam: any) => {
                const submission = submissionMap.get(exam.id)
                const isCompleted = submission?.is_completed || false
                const classroom = exam.classroom
                const dueDate = exam.due_date ? new Date(exam.due_date) : null
                const isOverdue = dueDate && dueDate < new Date() && !isCompleted
                
                return (
                  <Card 
                    key={exam.id}
                    className={`border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white group ${
                      isOverdue ? 'border-2 border-warm-coral' : ''
                    }`}
                  >
                    <Link href={`/dashboard/student/course/${exam.classroom_id}/exam/${exam.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <GraduationCap className="h-5 w-5 text-blue-600" />
                          </div>
                          {isCompleted && (
                            <CheckCircle2 className="h-5 w-5 text-success-green flex-shrink-0" />
                          )}
                        </div>
                        <CardTitle className="text-lg text-deep-teal group-hover:text-deep-teal/80 transition-colors mb-1">
                          {exam.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {classroom?.name} • {classroom?.subject}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {exam.description && (
                          <p className="text-sm text-slate-blue line-clamp-2">
                            {exam.description}
                          </p>
                        )}
                        <div className="space-y-1 text-xs text-slate-blue">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {exam.time_limit_minutes} minutes
                          </div>
                          {dueDate && (
                            <div className={isOverdue ? 'text-warm-coral font-semibold' : ''}>
                              Due: {dueDate.toLocaleDateString()} {isOverdue && '(Overdue)'}
                            </div>
                          )}
                        </div>
                        {isCompleted && submission && (
                          <div className="p-2 bg-success-green/10 rounded text-xs">
                            <span className="text-success-green font-semibold">
                              Score: {submission.score}/{submission.total_points} ({Math.round((submission.score / submission.total_points) * 100)}%)
                            </span>
                          </div>
                        )}
                        <Button 
                          className={`w-full text-white ${
                            isCompleted 
                              ? 'bg-success-green hover:bg-success-green/90' 
                              : isOverdue
                              ? 'bg-warm-coral hover:bg-warm-coral/90'
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                          size="sm"
                        >
                          {isCompleted ? 'View Results' : 'Take Exam'}
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
                <GraduationCap className="h-12 w-12 text-slate-blue/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-deep-teal mb-2">No Exams</h3>
                <p className="text-slate-blue">
                  No exams are available at the moment.
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
