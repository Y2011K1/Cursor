import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ courseId: string }>
}

export default async function StudentExamsPage({ params }: PageProps) {
  const { courseId } = await params
  const profile = await requireRole("student")
  const supabase = await createClient()

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select(`
      course:courses ( id, name, subject, teacher:profiles!classrooms_teacher_id_fkey ( id, full_name ) )
    `)
    .eq("student_id", profile.id)
    .eq("course_id", courseId)
    .eq("is_active", true)
    .single()

  if (!enrollment?.course) notFound()

  const raw = enrollment.course as unknown
  const course = (Array.isArray(raw) ? raw[0] : raw) as { id: string; name: string; subject: string | null; teacher: { full_name: string } | null }

  const { data: exams } = await supabase
    .from("exams")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  const list = exams || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button variant="ghost" size="sm" asChild className="text-slate-blue hover:text-deep-teal -ml-2">
              <Link href={`/dashboard/student?course=${courseId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="bg-gradient-to-r from-deep-teal/10 via-soft-mint/10 to-success-green/10 rounded-2xl p-6 border border-deep-teal/10">
            <h1 className="text-2xl md:text-3xl font-bold text-deep-teal mb-1">{course.name}</h1>
            {course.subject && <p className="text-slate-blue font-medium">Subject: {course.subject}</p>}
            <p className="text-slate-blue text-sm mt-1">Teacher: {course.teacher?.full_name ?? "Unknown"}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-deep-teal mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Exams
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.length > 0 ? (
                list.map((exam: any) => (
                  <Card key={exam.id} className="border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-deep-teal text-base">{exam.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {exam.description && <p className="text-sm text-slate-blue line-clamp-2">{exam.description}</p>}
                      <div className="flex items-center gap-2 text-xs text-slate-blue">
                        <span>⏱️ {exam.time_limit_minutes ?? "—"} min</span>
                        <span>One attempt only</span>
                        {exam.due_date && (
                          <span>📅 Due: {new Date(exam.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      <Button size="sm" className="w-full" asChild>
                        <Link href={`/dashboard/student/course/${courseId}/exam/${exam.id}`}>Take Exam</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-none shadow-sm rounded-2xl bg-white/80">
                  <CardContent className="py-6 text-center text-slate-blue text-sm">
                    No exams in this course yet. Check back later.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
