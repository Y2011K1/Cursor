import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, BookOpen } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { EnrollButton } from "@/components/enroll-button"

// Browse page can be cached for 60 seconds
export const revalidate = 60

export default async function BrowseCoursesPage() {
  const profile = await requireRole("student")
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from("courses")
    .select(`
      *,
      teacher:profiles!courses_teacher_id_fkey (
        id,
        full_name
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", profile.id)
    .eq("is_active", true)

  const enrolledCourseIds = new Set(
    enrollments?.map((e) => e.course_id) || []
  )

  const courseIds = courses?.map((c) => c.id) || []
  let countsMap = new Map<string, number>()
  if (courseIds.length > 0) {
    const { data: enrollmentCounts } = await supabase
      .from("enrollments")
      .select("course_id")
      .in("course_id", courseIds)
      .eq("is_active", true)

    enrollmentCounts?.forEach((e) => {
      countsMap.set(e.course_id, (countsMap.get(e.course_id) || 0) + 1)
    })
  }

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-deep-teal mb-2">
              Browse Courses
            </h1>
            <p className="text-slate-blue">
              Discover and join courses to start learning
            </p>
          </div>

          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any) => {
                const isEnrolled = enrolledCourseIds.has(course.id)
                const currentEnrollments = countsMap.get(course.id) || 0
                const isFull = currentEnrollments >= course.max_students

                return (
                  <Card
                    key={course.id}
                    className="border-0 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle className="text-deep-teal flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        {course.name}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        {course.subject && (
                          <span className="block font-medium">Subject: {course.subject}</span>
                        )}
                        <span className="block">Teacher: {course.teacher?.full_name || "Unknown"}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-blue">
                        {course.description || "No description provided"}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-blue">
                          <Users className="h-4 w-4" />
                          <span>
                            {currentEnrollments} / {course.max_students} students
                          </span>
                        </div>
                        {isFull && (
                          <span className="text-xs text-warm-coral font-medium">
                            Full
                          </span>
                        )}
                      </div>

                      {isEnrolled ? (
                        <Button
                          className="w-full bg-success-green hover:bg-success-green/90"
                          disabled
                        >
                          Already Enrolled
                        </Button>
                      ) : isFull ? (
                        <Button
                          className="w-full bg-slate-blue hover:bg-slate-blue/80"
                          disabled
                        >
                          Course Full
                        </Button>
                      ) : (
                        <EnrollButton
                          courseId={course.id}
                          studentId={profile.id}
                        />
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-deep-teal">No Courses Available</CardTitle>
                <CardDescription>
                  There are no active courses at the moment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-blue">
                  Check back later or contact an administrator.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
