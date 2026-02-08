import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { BookOpen, FileText, GraduationCap, Plus, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AddLessonDialog } from "@/components/add-lesson-dialog"
import { PublishCourseButton } from "@/components/publish-course-button"
import { AddQuizDialog } from "@/components/add-quiz-dialog"
import { AddExamDialog } from "@/components/add-exam-dialog"

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params
  const profile = await requireRole("teacher")
  const supabase = await createClient()

  // Get teacher's classroom
  const { data: classroom } = await supabase
    .from("courses")
    .select("id")
    .eq("teacher_id", profile.id)
    .single()

  // Get course and verify it belongs to teacher's classroom
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("course_id", classroom?.id)
    .single()

  if (!course) {
    notFound()
  }

  // Get lessons
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true })

  // Get quizzes
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .eq("course_id", course.id)
    .order("created_at", { ascending: false })

  // Get exams
  const { data: exams } = await supabase
    .from("exams")
    .select("*")
    .eq("course_id", course.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="teacher" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-deep-teal mb-2">
                  {course.title}
                </h1>
                <p className="text-slate-blue mb-2">
                  {course.description || "No description"}
                </p>
                <p className="text-sm text-slate-blue/70">
                  Manage your course materials: lessons, video lectures, assignments, and exams
                </p>
              </div>
              <div className="flex items-center gap-2">
                {course.is_published ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-success-green/20 text-success-green flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Published
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full bg-slate-blue/20 text-slate-blue flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Draft
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lessons Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-deep-teal flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Lessons
                    </CardTitle>
                    <AddLessonDialog classroomId={classroom?.id || ""} />
                  </div>
                </CardHeader>
                <CardContent>
                  {lessons && lessons.length > 0 ? (
                    <div className="space-y-3">
                      {lessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="p-4 border border-input rounded-md hover:bg-light-sky transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-deep-teal">
                                {index + 1}. {lesson.title}
                              </h3>
                              {lesson.content && (
                                <p className="text-sm text-slate-blue mt-1 line-clamp-2">
                                  {lesson.content}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-blue">
                                {lesson.video_url && (
                                  <span>📹 Video</span>
                                )}
                                {lesson.is_published ? (
                                  <span className="text-success-green">Published</span>
                                ) : (
                                  <span>Draft</span>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                // TODO: Implement lesson edit functionality
                                alert("Lesson editing will be available soon")
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-blue text-center py-4">
                      No lessons yet. Add your first lesson to get started.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quizzes Section */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-deep-teal flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Quizzes (Assignments)
                    </CardTitle>
                    <AddQuizDialog classroomId={classroom?.id || ""} />
                  </div>
                </CardHeader>
                <CardContent>
                  {quizzes && quizzes.length > 0 ? (
                    <div className="space-y-3">
                      {quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="p-4 border border-input rounded-md hover:bg-light-sky transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-deep-teal">
                                {quiz.title}
                              </h3>
                              {quiz.description && (
                                <p className="text-sm text-slate-blue mt-1">
                                  {quiz.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-blue">
                                {quiz.time_limit_minutes && (
                                  <span>⏱️ {quiz.time_limit_minutes} min</span>
                                )}
                                <span>Max attempts: {quiz.max_attempts}</span>
                                {quiz.is_published ? (
                                  <span className="text-success-green">Published</span>
                                ) : (
                                  <span>Draft</span>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/teacher/courses/${course.id}/quiz/${quiz.id}`}>
                                Manage
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-blue text-center py-4">
                      No quizzes yet. Add your first quiz to get started.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Exams Section */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-deep-teal flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Exams
                    </CardTitle>
                    <AddExamDialog classroomId={classroom?.id || ""} />
                  </div>
                </CardHeader>
                <CardContent>
                  {exams && exams.length > 0 ? (
                    <div className="space-y-3">
                      {exams.map((exam) => (
                        <div
                          key={exam.id}
                          className="p-4 border border-input rounded-md hover:bg-light-sky transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-deep-teal">
                                {exam.title}
                              </h3>
                              {exam.description && (
                                <p className="text-sm text-slate-blue mt-1">
                                  {exam.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-blue">
                                <span>⏱️ {exam.time_limit_minutes} min</span>
                                <span>One attempt only</span>
                                {exam.is_published ? (
                                  <span className="text-success-green">Published</span>
                                ) : (
                                  <span>Draft</span>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                // TODO: Implement exam management functionality
                                alert("Exam management will be available soon")
                              }}
                            >
                              Manage
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-blue text-center py-4">
                      No exams yet. Add your first exam to get started.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-deep-teal">Course Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <PublishCourseButton
                    courseId={course.id}
                    isPublished={course.is_published}
                  />
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement course edit functionality
                      alert("Course editing will be available soon")
                    }}
                  >
                    Edit Course Details
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-deep-teal">Course Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-blue">Lessons:</span>
                    <span className="font-medium text-deep-teal">{lessons?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-blue">Quizzes:</span>
                    <span className="font-medium text-deep-teal">{quizzes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-blue">Exams:</span>
                    <span className="font-medium text-deep-teal">{exams?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
