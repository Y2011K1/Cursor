import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Users, GraduationCap, BookOpen, Mail } from "lucide-react"
import Link from "next/link"
import { DeleteStudentButton } from "@/components/delete-student-button"

export default async function StudentsPage() {
  const profile = await requireRole("admin")
  const supabase = await createClient()

  // Get all students
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false })

  // Get enrollment counts for each student
  const studentIds = students?.map((s) => s.id) || []
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id, classroom_id, classrooms(name)")
    .in("student_id", studentIds)
    .eq("is_active", true)

  // Group enrollments by student
  const enrollmentMap = new Map<string, any[]>()
  enrollments?.forEach((e: any) => {
    const existing = enrollmentMap.get(e.student_id) || []
    enrollmentMap.set(e.student_id, [...existing, e])
  })

  // Get total classrooms count
  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("id")
    .eq("is_active", true)

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="admin" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-deep-teal mb-2">
              Student Management
            </h1>
            <p className="text-slate-blue">
              View and manage all students in the platform
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-blue">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-deep-teal" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-deep-teal">
                  {students?.length || 0}
                </div>
                <p className="text-xs text-slate-blue mt-1">
                  Registered students
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-blue">
                  Enrolled Students
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-deep-teal" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-deep-teal">
                  {enrollmentMap.size}
                </div>
                <p className="text-xs text-slate-blue mt-1">
                  Students in classrooms
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-blue">
                  Total Classrooms
                </CardTitle>
                <BookOpen className="h-4 w-4 text-deep-teal" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-deep-teal">
                  {classrooms?.length || 0}
                </div>
                <p className="text-xs text-slate-blue mt-1">
                  Active classrooms
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Students List */}
          {students && students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => {
                const studentEnrollments = enrollmentMap.get(student.id) || []
                const classroomNames = studentEnrollments
                  .map((e: any) => e.classrooms?.name)
                  .filter(Boolean)

                return (
                  <Card
                    key={student.id}
                    className="border-0 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle className="text-deep-teal flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {student.full_name}
                      </CardTitle>
                      <CardDescription>
                        Student Account
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-blue">Enrollments:</span>
                          <span className="text-dark-text font-medium">
                            {studentEnrollments.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-blue">Joined:</span>
                          <span className="text-dark-text font-medium">
                            {new Date(student.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {classroomNames.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-slate-blue">
                            Enrolled in:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {classroomNames.map((name, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 rounded-full bg-soft-mint/30 text-deep-teal"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {classroomNames.length === 0 && (
                        <p className="text-xs text-slate-blue italic">
                          Not enrolled in any classroom
                        </p>
                      )}

                      <div className="pt-4 border-t">
                        <DeleteStudentButton
                          studentId={student.id}
                          studentName={student.full_name}
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
                <CardTitle className="text-deep-teal">No Students Yet</CardTitle>
                <CardDescription>
                  Students will appear here once they sign up
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-blue">
                  Students can sign up through the registration page and will
                  automatically appear in this list.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
