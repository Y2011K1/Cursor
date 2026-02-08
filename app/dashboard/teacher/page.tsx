import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function TeacherDashboardPage() {
  try {
    const profile = await requireRole("teacher")
    const supabase = await createClient()

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("teacher_id", profile.id)
      .single()

    if (courseError || !course) {
      console.error("Course fetch error:", courseError)
      console.error("Profile ID:", profile.id)
      console.error("Profile role:", profile.role)
      const { data: allCourses, error: checkError } = await supabase
        .from("courses")
        .select("id, teacher_id, name")
        .eq("teacher_id", profile.id)
      console.error("All courses check:", allCourses, checkError)
      return (
        <div className="min-h-screen bg-light-sky flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-deep-teal mb-2">No Course Found</h1>
            <p className="text-slate-blue mb-4">Please contact an administrator to set up your course.</p>
            {courseError && (
              <div className="mt-4 p-4 bg-warm-coral/10 rounded-md">
                <p className="text-sm text-warm-coral font-semibold mb-2">Error Details:</p>
                <p className="text-xs text-slate-blue">{courseError.message}</p>
                <p className="text-xs text-slate-blue mt-1">Code: {courseError.code}</p>
              </div>
            )}
          </div>
        </div>
      )
    }

    if (!course.id) {
      return (
        <div className="min-h-screen bg-light-sky flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-deep-teal mb-2">Invalid Course</h1>
            <p className="text-slate-blue">Course ID is missing. Please contact an administrator.</p>
          </div>
        </div>
      )
    }
    redirect(`/dashboard/teacher/classroom/${course.id}`)
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
