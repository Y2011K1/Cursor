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

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("is_active", true)
    .limit(1)

  const canLeaveTestimonial = enrollments && enrollments.length > 0

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
                Only students who have joined a course can submit a testimonial. It may be shown on the landing page after approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canLeaveTestimonial ? (
                <LeaveTestimonialForm />
              ) : (
                <p className="text-slate-600">
                  You need to be enrolled in at least one course before you can leave a testimonial.{" "}
                  <Link href="/dashboard/student/browse-courses" className="text-deep-teal font-medium hover:underline">
                    Browse courses
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
