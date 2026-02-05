import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Users } from "lucide-react"
import { RemoveFromClassroomButton } from "@/components/remove-from-classroom-button"
import { DeleteStudentButton } from "@/components/delete-student-button"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StudentsPage() {
  const profile = await requireRole("admin")
  const supabase = await createClient()
  const adminClient = getAdminClient()

  // Fetch all students with their enrollments and classroom details
  const { data: students, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      created_at,
      enrollments:enrollments(
        id,
        is_active,
        created_at,
        classroom:classrooms(
          id,
          name,
          subject,
          teacher:profiles!classrooms_teacher_id_fkey(full_name)
        )
      )
    `)
    .eq("role", "student")
    .order("full_name", { ascending: true })

  if (error) {
    console.error("Error fetching students:", error)
  }

  // Fetch emails using admin client
  const studentEmails = new Map<string, string>()
  if (students) {
    for (const student of students) {
      try {
        const { data: authUser } = await adminClient.auth.admin.getUserById(student.id)
        if (authUser?.user?.email) {
          studentEmails.set(student.id, authUser.user.email)
        }
      } catch (err) {
        console.error(`Error fetching email for student ${student.id}:`, err)
      }
    }
  }

  // Filter only active enrollments
  const studentsWithActiveEnrollments = students?.map(student => ({
    ...student,
    email: studentEmails.get(student.id) || null,
    enrollments: student.enrollments?.filter((e: any) => e.is_active) || []
  })) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-sky via-white to-light-sky">
      <Navigation userRole="admin" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-deep-teal mb-2">
              Manage Students
            </h1>
            <p className="text-slate-blue">
              View and manage student accounts and enrollments
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-deep-teal" />
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-deep-teal">
                  {studentsWithActiveEnrollments?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-success-green" />
                  Active Enrollments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success-green">
                  {studentsWithActiveEnrollments?.reduce((sum, s) => sum + s.enrollments.length, 0) || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-slate-blue" />
                  Avg Enrollments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-blue">
                  {studentsWithActiveEnrollments?.length 
                    ? (studentsWithActiveEnrollments.reduce((sum, s) => sum + s.enrollments.length, 0) / studentsWithActiveEnrollments.length).toFixed(1)
                    : 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students List */}
          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
            </CardHeader>
            <CardContent>
              {!studentsWithActiveEnrollments || studentsWithActiveEnrollments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No students found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentsWithActiveEnrollments.map((student) => (
                    <div
                      key={student.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Student Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {student.full_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {student.email || 'No email'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Joined: {new Date(student.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {/* Delete Account Button */}
                        <DeleteStudentButton
                          studentId={student.id}
                          studentName={student.full_name}
                        />
                      </div>

                      {/* Enrollments */}
                      <div className="mt-4">
                        <div className="text-sm font-semibold text-gray-700 mb-2">
                          Enrolled in {student.enrollments.length} classroom{student.enrollments.length !== 1 ? 's' : ''}:
                        </div>
                        
                        {student.enrollments.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">
                            Not enrolled in any classrooms
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {student.enrollments.map((enrollment: any) => (
                              <div
                                key={enrollment.id}
                                className="flex items-center justify-between bg-gray-50 rounded p-3"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {enrollment.classroom?.name || 'Unknown Classroom'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Subject: {enrollment.classroom?.subject || 'N/A'} • 
                                    Teacher: {enrollment.classroom?.teacher?.full_name || 'Unknown'}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    Enrolled: {new Date(enrollment.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                                
                                {/* Remove from Classroom Button */}
                                <RemoveFromClassroomButton
                                  studentId={student.id}
                                  studentName={student.full_name}
                                  classroomId={enrollment.classroom?.id || ''}
                                  classroomName={enrollment.classroom?.name || 'Unknown'}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
