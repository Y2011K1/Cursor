import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Debug page can be cached for 30 seconds
export const revalidate = 30

export default async function DebugContentPage() {
  // Allow any authenticated user to access debug page
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="min-h-screen bg-light-sky p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-deep-teal">Debug Content Page</h1>
          <p className="text-slate-blue mt-4">Please log in to view debug information.</p>
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen bg-light-sky p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-deep-teal">Debug Content Page</h1>
          <p className="text-slate-blue mt-4">Profile not found.</p>
        </div>
      </div>
    )
  }

  // Get all content without filters to see what's actually in the database
  const [allLessons, allQuizzes, allExams, allMaterials, enrollments, classrooms] = await Promise.all([
    supabase.from("lessons").select("*").order("created_at", { ascending: false }),
    supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
    supabase.from("exams").select("*").order("created_at", { ascending: false }),
    supabase.from("course_materials").select("*").order("created_at", { ascending: false }),
    profile.role === "student" 
      ? supabase.from("enrollments").select("*").eq("student_id", profile.id)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("courses").select("id, name, is_active, teacher_id").order("created_at", { ascending: false })
  ])

  return (
    <div className="min-h-screen bg-light-sky p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-deep-teal">Content Debug Page</h1>
        <p className="text-slate-blue">Role: {profile.role} | User ID: {profile.id}</p>

        {/* Enrollments (for students) */}
        {profile.role === "student" && (
          <Card>
            <CardHeader>
              <CardTitle>Your Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(enrollments.data || [], null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Classrooms */}
        <Card>
          <CardHeader>
            <CardTitle>All Classrooms</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(classrooms.data || [], null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Lessons */}
        <Card>
          <CardHeader>
            <CardTitle>All Lessons ({allLessons.data?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-slate-blue">
                Published: {allLessons.data?.filter((l: any) => l.is_published).length || 0} | 
                Draft: {allLessons.data?.filter((l: any) => !l.is_published).length || 0}
              </p>
            </div>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(allLessons.data || [], null, 2)}
            </pre>
            {allLessons.error && (
              <div className="mt-4 p-4 bg-red-50 rounded">
                <p className="text-red-700 font-semibold">Error:</p>
                <p className="text-red-600 text-sm">{allLessons.error.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle>All Quizzes ({allQuizzes.data?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-slate-blue">
                Published: {allQuizzes.data?.filter((q: any) => q.is_published).length || 0} | 
                Draft: {allQuizzes.data?.filter((q: any) => !q.is_published).length || 0}
              </p>
            </div>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(allQuizzes.data || [], null, 2)}
            </pre>
            {allQuizzes.error && (
              <div className="mt-4 p-4 bg-red-50 rounded">
                <p className="text-red-700 font-semibold">Error:</p>
                <p className="text-red-600 text-sm">{allQuizzes.error.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exams */}
        <Card>
          <CardHeader>
            <CardTitle>All Exams ({allExams.data?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-slate-blue">
                Published: {allExams.data?.filter((e: any) => e.is_published).length || 0} | 
                Draft: {allExams.data?.filter((e: any) => !e.is_published).length || 0}
              </p>
            </div>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(allExams.data || [], null, 2)}
            </pre>
            {allExams.error && (
              <div className="mt-4 p-4 bg-red-50 rounded">
                <p className="text-red-700 font-semibold">Error:</p>
                <p className="text-red-600 text-sm">{allExams.error.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Materials */}
        <Card>
          <CardHeader>
            <CardTitle>All Course Materials ({allMaterials.data?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-slate-blue">
                Published: {allMaterials.data?.filter((m: any) => m.is_published).length || 0} | 
                Draft: {allMaterials.data?.filter((m: any) => !m.is_published).length || 0}
              </p>
            </div>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(allMaterials.data || [], null, 2)}
            </pre>
            {allMaterials.error && (
              <div className="mt-4 p-4 bg-red-50 rounded">
                <p className="text-red-700 font-semibold">Error:</p>
                <p className="text-red-600 text-sm">{allMaterials.error.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
