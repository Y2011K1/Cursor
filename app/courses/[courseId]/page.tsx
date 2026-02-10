import { createClient } from "@/lib/supabase/server"
import { LandingHeader } from "@/components/landing-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Star, Users, Clock, Award, BookOpen, CheckCircle2 } from "lucide-react"
import { notFound } from "next/navigation"

export const revalidate = 300

export const metadata = {
  title: "Course Details – EduPlatform",
  description: "View course details and enroll to start learning.",
}

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params
  const supabase = await createClient()
  
  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch course details
  const { data: course } = await supabase
    .from("courses")
    .select(`
      id,
      name,
      description,
      rating,
      total_ratings,
      specialization,
      difficulty_level,
      estimated_duration_hours,
      certification_available,
      thumbnail_url,
      teacher:profiles!classrooms_teacher_id_fkey ( id, full_name )
    `)
    .eq("id", courseId)
    .eq("is_active", true)
    .single()

  if (!course) {
    notFound()
  }

  const teacher = Array.isArray(course.teacher) ? course.teacher[0] : course.teacher

  // Get course statistics (only if user is authenticated)
  let enrollmentCount = null
  let isEnrolled = false
  
  if (user) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("is_active", true)
    
    enrollmentCount = enrollments?.length || 0
    
    // Check if current user is enrolled
    const { data: userEnrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("student_id", user.id)
      .eq("is_active", true)
      .single()
    
    isEnrolled = !!userEnrollment
  } else {
    // Get enrollment count without user info (public)
    const { count } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId)
      .eq("is_active", true)
    
    enrollmentCount = count ?? 0
  }

  return (
    <div className="min-h-screen bg-light-sky">
      <LandingHeader />
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-7xl">
        <Button
          variant="ghost"
          asChild
          className="mb-6 -ml-2 text-deep-teal transition-colors duration-200 hover:bg-deep-teal/10"
        >
          <Link href="/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                {course.thumbnail_url && (
                  <div className="mb-6 -mx-6 -mt-6">
                    <img
                      src={course.thumbnail_url}
                      alt={course.name}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}
                <h1 className="text-3xl font-bold text-deep-teal mb-2">{course.name}</h1>
                <p className="text-lg text-slate-blue mb-4">
                  Instructor: <span className="font-semibold">{teacher?.full_name ?? "Unknown"}</span>
                </p>
                {(course.rating != null && Number(course.rating) > 0) && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-warning-yellow text-warning-yellow" />
                      <span className="font-bold text-lg">{Number(course.rating).toFixed(1)}</span>
                    </div>
                    {course.total_ratings > 0 && (
                      <span className="text-slate-600">({course.total_ratings} ratings)</span>
                    )}
                  </div>
                )}
                <p className="text-slate-blue leading-relaxed">{course.description || "No description available."}</p>
              </CardContent>
            </Card>

            {/* Course Details */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-deep-teal">Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.specialization && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-deep-teal mt-0.5" />
                    <div>
                      <p className="font-semibold text-deep-teal">Specialization</p>
                      <p className="text-slate-blue">{course.specialization}</p>
                    </div>
                  </div>
                )}
                {course.difficulty_level && (
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-deep-teal mt-0.5" />
                    <div>
                      <p className="font-semibold text-deep-teal">Difficulty Level</p>
                      <p className="text-slate-blue capitalize">{course.difficulty_level}</p>
                    </div>
                  </div>
                )}
                {course.estimated_duration_hours && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-deep-teal mt-0.5" />
                    <div>
                      <p className="font-semibold text-deep-teal">Estimated Duration</p>
                      <p className="text-slate-blue">{course.estimated_duration_hours} hours</p>
                    </div>
                  </div>
                )}
                {course.certification_available && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success-green mt-0.5" />
                    <div>
                      <p className="font-semibold text-deep-teal">Certificate Available</p>
                      <p className="text-slate-blue">Complete this course to earn a certificate</p>
                    </div>
                  </div>
                )}
                {enrollmentCount !== null && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-deep-teal mt-0.5" />
                    <div>
                      <p className="font-semibold text-deep-teal">Enrolled Students</p>
                      <p className="text-slate-blue">{enrollmentCount} students</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Enrollment */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-md sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-deep-teal">Enroll Now</CardTitle>
                <CardDescription>
                  {isEnrolled
                    ? "You are already enrolled in this course"
                    : user
                    ? "Start learning today"
                    : "Sign in to enroll in this course"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEnrolled ? (
                  <Button asChild className="w-full bg-success-green hover:bg-success-green/90">
                    <Link href={`/dashboard/student/course/${courseId}/lessons`}>Go to Course</Link>
                  </Button>
                ) : user ? (
                  <Button asChild className="w-full bg-deep-teal hover:bg-deep-teal/90">
                    <Link href={`/dashboard/student/course/${courseId}/lessons`}>Enroll Now</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild className="w-full bg-deep-teal hover:bg-deep-teal/90">
                      <Link href={`/signup?redirect=/courses/${courseId}`}>Sign Up to Enroll</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full border-deep-teal text-deep-teal">
                      <Link href={`/login?redirect=/courses/${courseId}`}>Sign In</Link>
                    </Button>
                  </>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-slate-blue">
                    By enrolling, you'll get access to:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-blue">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success-green" />
                      All course materials
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success-green" />
                      Video lessons
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success-green" />
                      Assignments and quizzes
                    </li>
                    {course.certification_available && (
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success-green" />
                        Certificate upon completion
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
