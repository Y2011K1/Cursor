import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { ScoreCard } from "@/components/score-card"
import { ArrowLeft, FileText, GraduationCap, Award } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function MyScoresPage() {
  const profile = await requireRole("student")
  const supabase = await createClient()

  const { data: submissions } = await supabase
    .from("quiz_submissions")
    .select(`
      id,
      quiz_id,
      score,
      total_points,
      submitted_at,
      attempt_number,
      pass_fail_status,
      quiz:quizzes(id, title, course_id)
    `)
    .eq("student_id", profile.id)
    .eq("is_completed", true)
    .order("submitted_at", { ascending: false })

  const courseIds = [
    ...new Set(
      (submissions || [])
        .map((s: any) => s.quiz?.course_id)
        .filter(Boolean)
    ),
  ]
  const { data: courses } =
    courseIds.length > 0
      ? await supabase.from("courses").select("id, name").in("id", courseIds)
      : { data: [] }
  const courseMap = new Map((courses || []).map((c: any) => [c.id, c.name]))

  const quizSubmissions = submissions || []
  const totalQuizzes = quizSubmissions.length
  const avgScore =
    totalQuizzes > 0
      ? quizSubmissions.reduce((sum: number, s: any) => {
          const p = s.total_points > 0 ? ((s.score || 0) / s.total_points) * 100 : 0
          return sum + p
        }, 0) / totalQuizzes
      : 0
  const performanceLevel =
    avgScore >= 90 ? "Excellent" : avgScore >= 70 ? "Good" : "Needs Improvement"

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/student">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-deep-teal">My Scores</h1>
              <p className="text-slate-blue">View your quiz and assignment performance</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-slate-blue">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm">Quizzes taken</span>
                </div>
                <p className="text-2xl font-bold text-deep-teal mt-1">{totalQuizzes}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-slate-blue">
                  <Award className="h-5 w-5" />
                  <span className="text-sm">Average score</span>
                </div>
                <p className="text-2xl font-bold text-deep-teal mt-1">
                  {avgScore.toFixed(0)}%
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-slate-blue">
                  <GraduationCap className="h-5 w-5" />
                  <span className="text-sm">Performance</span>
                </div>
                <p
                  className={`text-xl font-bold mt-1 ${
                    performanceLevel === "Excellent"
                      ? "text-success-green"
                      : performanceLevel === "Good"
                        ? "text-warning-yellow"
                        : "text-warm-coral"
                  }`}
                >
                  {performanceLevel}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-deep-teal">Quiz scores</CardTitle>
              <p className="text-sm text-slate-blue">Your completed quiz attempts</p>
            </CardHeader>
            <CardContent>
              {quizSubmissions.length === 0 ? (
                <p className="text-slate-500 py-8 text-center">
                  No quiz scores yet. Complete quizzes in your courses to see them here.
                </p>
              ) : (
                <div className="space-y-4">
                  {quizSubmissions.map((s: any) => {
                    const percentage =
                      (s.total_points > 0 ? (s.score || 0) / s.total_points : 0) * 100
                    const status =
                      percentage >= 60
                        ? ("pass" as const)
                        : ("fail" as const)
                    return (
                      <div
                        key={s.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-deep-teal/10 hover:bg-deep-teal/5"
                      >
                        <div>
                          <p className="font-medium text-deep-teal">
                            {s.quiz?.title || "Quiz"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {s.quiz?.course_id
                              ? courseMap.get(s.quiz.course_id) || "Course"
                              : "Course"}
                          </p>
                        </div>
                        <ScoreCard
                          score={s.score ?? 0}
                          totalPoints={s.total_points ?? 0}
                          percentage={percentage}
                          status={s.pass_fail_status || status}
                          attemptNumber={s.attempt_number}
                          dateTaken={s.submitted_at}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
