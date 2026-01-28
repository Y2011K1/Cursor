import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function TeacherDashboardPage() {
  try {
    const profile = await requireRole("teacher")
    const supabase = await createClient()

    // Get teacher's classroom
    const { data: classroom, error: classroomError } = await supabase
      .from("classrooms")
      .select("id")
      .eq("teacher_id", profile.id)
      .single()

    if (classroomError || !classroom) {
      // If no classroom, show error (shouldn't happen as classrooms are auto-created)
      console.error("Classroom fetch error:", classroomError)
      console.error("Profile ID:", profile.id)
      console.error("Profile role:", profile.role)
      
      // Try to check if any classrooms exist for this teacher
      const { data: allClassrooms, error: checkError } = await supabase
        .from("classrooms")
        .select("id, teacher_id, name")
        .eq("teacher_id", profile.id)
      
      console.error("All classrooms check:", allClassrooms, checkError)
      
      return (
        <div className="min-h-screen bg-light-sky flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-deep-teal mb-2">No Classroom Found</h1>
            <p className="text-slate-blue mb-4">Please contact an administrator to set up your classroom.</p>
            {classroomError && (
              <div className="mt-4 p-4 bg-warm-coral/10 rounded-md">
                <p className="text-sm text-warm-coral font-semibold mb-2">Error Details:</p>
                <p className="text-xs text-slate-blue">{classroomError.message}</p>
                <p className="text-xs text-slate-blue mt-1">Code: {classroomError.code}</p>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Verify classroom ID is valid before redirecting
    if (!classroom.id) {
      return (
        <div className="min-h-screen bg-light-sky flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-deep-teal mb-2">Invalid Classroom</h1>
            <p className="text-slate-blue">Classroom ID is missing. Please contact an administrator.</p>
          </div>
        </div>
      )
    }

    // Redirect directly to classroom content page
    redirect(`/dashboard/teacher/classroom/${classroom.id}`)
  } catch (error: any) {
    // If it's a redirect, re-throw it
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    // Handle authentication errors
    console.error("Teacher dashboard error:", error)
    if (error?.message?.includes("Unauthorized")) {
      redirect("/login")
    }
    // Show error page
    return (
      <div className="min-h-screen bg-light-sky flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-deep-teal mb-2">Error Loading Dashboard</h1>
          <p className="text-slate-blue mb-4">{error?.message || "An unexpected error occurred"}</p>
          <a href="/login" className="text-deep-teal hover:underline">Go to Login</a>
        </div>
      </div>
    )
  }
}
