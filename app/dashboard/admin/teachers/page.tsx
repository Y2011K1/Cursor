import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { GraduationCap, Plus, Users } from "lucide-react"
import Link from "next/link"
import { AddTeacherDialog } from "@/components/add-teacher-dialog"
import { DeleteTeacherButton } from "@/components/delete-teacher-button"

export default async function TeachersPage() {
  const profile = await requireRole("admin")
  const supabase = await createClient()

  // Get all teachers with their classrooms
  // Note: We'll need to join with auth.users to get email, but for now we'll use profiles
  const { data: teachers } = await supabase
    .from("profiles")
    .select(`
      *,
      classroom:classrooms (
        id,
        name,
        max_students
      )
    `)
    .eq("role", "teacher")
    .order("created_at", { ascending: false })

  // Get emails from auth.users (requires service role, so we'll handle this differently)
  // For now, we'll show the user ID as a placeholder

  // Get student counts for each classroom (optimized)
  const classroomIds = teachers
    ?.map((t: any) => t.classroom?.id)
    .filter(Boolean) || []

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
      <Navigation userRole="admin" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-deep-teal mb-2">
                Teacher Management
              </h1>
              <p className="text-slate-blue">
                Add and manage teachers in the platform
              </p>
            </div>
            <AddTeacherDialog />
          </div>

          {teachers && teachers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((teacher: any) => {
                const studentCount = teacher.classroom
                  ? countsMap.get(teacher.classroom.id) || 0
                  : 0

                return (
                  <Card
                    key={teacher.id}
                    className="border-0 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle className="text-deep-teal flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        {teacher.full_name}
                      </CardTitle>
                      <CardDescription>
                        {teacher.classroom?.name || "No classroom"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        {teacher.classroom && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-blue flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Students:
                            </span>
                            <span className="text-dark-text font-medium">
                              {studentCount} / {teacher.classroom.max_students}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {teacher.classroom && (
                          <Button
                            variant="outline"
                            className="flex-1"
                            asChild
                          >
                            <Link href={`/dashboard/admin/classrooms/${teacher.classroom.id}`}>
                              View Classroom
                            </Link>
                          </Button>
                        )}
                        <DeleteTeacherButton
                          teacherId={teacher.id}
                          teacherName={teacher.full_name}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-deep-teal">No Teachers Yet</CardTitle>
                <CardDescription>
                  Add your first teacher to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddTeacherDialog />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
