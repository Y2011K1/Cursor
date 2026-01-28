import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, BookOpen } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { EnrollButton } from "@/components/enroll-button"

export default async function BrowseClassroomsPage() {
  const profile = await requireRole("student")
  const supabase = await createClient()

  // Get all active classrooms with teacher info
  const { data: classrooms } = await supabase
    .from("classrooms")
    .select(`
      *,
      teacher:profiles!classrooms_teacher_id_fkey (
        id,
        full_name
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  // Get student's current enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("classroom_id")
    .eq("student_id", profile.id)
    .eq("is_active", true)

  const enrolledClassroomIds = new Set(
    enrollments?.map((e) => e.classroom_id) || []
  )

  // Get enrollment counts for each classroom (optimized with single query)
  const classroomIds = classrooms?.map((c) => c.id) || []
  
  // Only query if there are classrooms
  let countsMap = new Map<string, number>()
  if (classroomIds.length > 0) {
    const { data: enrollmentCounts } = await supabase
      .from("enrollments")
      .select("classroom_id")
      .in("classroom_id", classroomIds)
      .eq("is_active", true)

    enrollmentCounts?.forEach((e) => {
      countsMap.set(e.classroom_id, (countsMap.get(e.classroom_id) || 0) + 1)
    })
  }

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-deep-teal mb-2">
              Browse Classrooms
            </h1>
            <p className="text-slate-blue">
              Discover and join classrooms to start learning
            </p>
          </div>

          {classrooms && classrooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((classroom: any) => {
                const isEnrolled = enrolledClassroomIds.has(classroom.id)
                const currentEnrollments = countsMap.get(classroom.id) || 0
                const isFull = currentEnrollments >= classroom.max_students

                return (
                  <Card
                    key={classroom.id}
                    className="border-0 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle className="text-deep-teal flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        {classroom.name}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        {classroom.subject && (
                          <span className="block font-medium">Subject: {classroom.subject}</span>
                        )}
                        <span className="block">Teacher: {classroom.teacher?.full_name || "Unknown"}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-blue">
                        {classroom.description || "No description provided"}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-blue">
                          <Users className="h-4 w-4" />
                          <span>
                            {currentEnrollments} / {classroom.max_students} students
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
                          Classroom Full
                        </Button>
                      ) : (
                        <EnrollButton
                          classroomId={classroom.id}
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
                <CardTitle className="text-deep-teal">No Classrooms Available</CardTitle>
                <CardDescription>
                  There are no active classrooms at the moment
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
