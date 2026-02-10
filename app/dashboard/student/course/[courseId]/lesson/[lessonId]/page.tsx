import { redirect, notFound } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { ArrowLeft, PlayCircle, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { MarkCompleteButton } from "@/components/mark-complete-button"
import nextDynamic from "next/dynamic"

// Lazy load VideoPlayer - heavy component with video handling (no ssr:false in Server Components)
const VideoPlayer = nextDynamic(() => import("@/components/video-player").then(mod => ({ default: mod.VideoPlayer })), {
  loading: () => <div className="animate-pulse bg-gray-200 w-full h-full rounded flex items-center justify-center"><span className="text-gray-400">Loading video player...</span></div>,
})

interface LessonPageProps {
  params: Promise<{ courseId: string; lessonId: string }>
}

export default async function StudentLessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params
  const profile = await requireRole("student")
  const supabase = await createClient()

  const { data: course } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .eq("is_active", true)
    .single()

  if (!course) {
    notFound()
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", profile.id)
    .eq("course_id", course.id)
    .eq("is_active", true)
    .single()

  if (!enrollment) {
    redirect(`/dashboard/student?course=${courseId}`)
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .eq("is_published", true)
    .single()

  if (!lesson) {
    notFound()
  }

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("student_id", profile.id)
    .eq("lesson_id", lessonId)
    .single()

  const isCompleted = progress?.is_completed || false

  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("order_index", { ascending: true })

  const currentIndex = allLessons?.findIndex((l) => l.id === lessonId) || -1
  const nextLesson = currentIndex >= 0 && currentIndex < (allLessons?.length || 0) - 1 && allLessons
    ? allLessons[currentIndex + 1]
    : null
  const prevLesson = currentIndex > 0 && allLessons ? allLessons[currentIndex - 1] : null

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="text-slate-blue hover:text-deep-teal -ml-2">
                <Link href={`/dashboard/student/course/${courseId}/lessons`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Video Lectures
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-slate-blue hover:text-deep-teal">
                <Link href={`/dashboard/student?course=${courseId}`}>
                  Dashboard
                </Link>
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-deep-teal mb-2">
                {lesson.title}
              </h1>
              {isCompleted && (
                <div className="flex items-center gap-2 text-success-green">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Completed</span>
                </div>
              )}
            </div>
          </div>

          <Card className="border-0 shadow-md mb-6">
            <CardContent className="p-6">
              {lesson.video_url && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-deep-teal mb-3 flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Video Lesson
                  </h3>
                  <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden">
                    <VideoPlayer
                      videoUrl={lesson.video_url}
                      videoProvider={lesson.video_provider}
                      lessonId={lessonId}
                      studentId={profile.id}
                    />
                  </div>
                </div>
              )}

              {lesson.content && (
                <div>
                  <h3 className="text-lg font-semibold text-deep-teal mb-3">
                    Lesson Content
                  </h3>
                  <div className="prose max-w-none text-slate-blue whitespace-pre-wrap">
                    {lesson.content}
                  </div>
                </div>
              )}

              {!lesson.video_url && !lesson.content && (
                <p className="text-slate-blue italic">
                  No content available for this lesson yet.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <MarkCompleteButton
              lessonId={lessonId}
              studentId={profile.id}
              isCompleted={isCompleted}
            />
            <div className="flex gap-2">
              {prevLesson && (
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/student/course/${courseId}/lesson/${prevLesson.id}`}>
                    Previous Lesson
                  </Link>
                </Button>
              )}
              {nextLesson ? (
                <Button className="bg-deep-teal hover:bg-deep-teal/90" asChild>
                  <Link href={`/dashboard/student/course/${courseId}/lesson/${nextLesson.id}`}>
                    Next Lesson
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
