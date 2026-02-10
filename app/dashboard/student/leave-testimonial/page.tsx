import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { LeaveTestimonialForm } from "@/components/leave-testimonial-form"
import { Quote } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function LeaveTestimonialPage() {
  await requireRole("student")
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: enrollments },
    { data: lessonProgress },
    { data: quizSubmissions },
    { data: examSubmissions },
  ] = await Promise.all([
    supabase.from("enrollments").select("id").eq("student_id", user.id).eq("is_active", true).limit(1),
    supabase.from("lesson_progress").select("id").eq("student_id", user.id).eq("is_completed", true).limit(1),
    supabase.from("quiz_submissions").select("id").eq("student_id", user.id).eq("is_completed", true).limit(1),
    supabase.from("exam_submissions").select("id").eq("student_id", user.id).eq("is_completed", true).limit(1),
  ])

  const hasEnrollment = (enrollments?.length ?? 0) > 0
  const hasFinishedContent = (lessonProgress?.length ?? 0) > 0 || (quizSubmissions?.length ?? 0) > 0 || (examSubmissions?.length ?? 0) > 0
  const canLeaveTestimonial = hasEnrollment && hasFinishedContent

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="student" />
      <div className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" asChild className="mb-4 -ml-2">
            <Link href="/dashboard/student">← Back to dashboard</Link>
          </Button>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-deep-teal flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Leave a testimonial
              </CardTitle>
              <CardDescription>
                After finishing at least one lesson, assignment, or exam you can submit a testimonial. It may be shown on the landing page after approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canLeaveTestimonial ? (
                <LeaveTestimonialForm />
              ) : !hasEnrollment ? (
                <p className="text-slate-600">
                  You need to be enrolled in at least one course before you can leave a testimonial.{" "}
                  <Link href="/dashboard/student/browse-courses" className="text-deep-teal font-medium hover:underline">
                    Browse courses
                  </Link>
                </p>
              ) : (
                <p className="text-slate-600">
                  Complete at least one lesson, assignment, or exam to leave a testimonial.{" "}
                  <Link href="/dashboard/student" className="text-deep-teal font-medium hover:underline">
                    Back to dashboard
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
