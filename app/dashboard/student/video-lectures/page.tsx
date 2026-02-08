import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Video, PlayCircle, BookOpen, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function VideoLecturesPage() {
  noStore() // Prevent caching
  const profile = await requireRole("student")
  const supabase = await createClient()

  // Get student's enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
      course:courses!inner (
        id,
        name,
        subject,
        is_active
      )
    `)
    .eq("student_id", profile.id)
    .eq("is_active", true)
  
  const activeEnrollments = enrollments?.filter((e: any) => e.course?.is_active === true) || []
  const courseIds = activeEnrollments?.map((e: any) => e.course?.id).filter(Boolean) || []

  // Get all lessons - RLS will filter by enrollment
  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select(`
      *,
      course:courses!inner (
        id,
        name,
        subject
      )
    `)
    .eq("is_published", true)
    .order("order_index", { ascending: true })

  if (lessonsError) {
    console.error("Error fetching lessons:", lessonsError)
  }

  const lessonIds = lessons?.map((l) => l.id) || []
  const { data: progress } = lessonIds.length > 0
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id, is_completed")
        .eq("student_id", profile.id)
        .in("lesson_id", lessonIds)
    : { data: [] }

  const progressMap = new Map<string, boolean>()
  progress?.forEach((p) => {
    progressMap.set(p.lesson_id, p.is_completed)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-sky via-white to-light-sky">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8">
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
                <Video className="h-8 w-8" />
                Video Lectures
              </h1>
              <p className="text-slate-blue mt-1">
                {lessons?.length || 0} lesson{lessons?.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>

          {lessons && lessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((lesson: any, index: number) => {
                const isCompleted = progressMap.get(lesson.id) || false
                const course = lesson.course
                
                return (
                  <Card 
                    key={lesson.id}
                    className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white group"
                  >
                    <Link href={`/dashboard/student/course/${lesson.course_id}/lesson/${lesson.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            {lesson.video_url ? (
                              <Video className="h-5 w-5 text-orange-600" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-orange-600" />
                            )}
                          </div>
                          {isCompleted && (
                            <CheckCircle2 className="h-5 w-5 text-success-green flex-shrink-0" />
                          )}
                        </div>
                        <CardTitle className="text-lg text-deep-teal group-hover:text-deep-teal/80 transition-colors mb-1">
                          {lesson.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {course?.name} • {course?.subject}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {lesson.content && (
                          <p className="text-sm text-slate-blue line-clamp-2">
                            {lesson.content}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${isCompleted ? 'text-success-green' : 'text-slate-blue'}`}>
                            {isCompleted ? 'Completed' : 'Not started'}
                          </span>
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                            {isCompleted ? 'Review' : 'Start'}
                          </Button>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-8 text-center">
                <Video className="h-12 w-12 text-slate-blue/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-deep-teal mb-2">No Video Lectures</h3>
                <p className="text-slate-blue">
                  No video lectures are available at the moment.
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
