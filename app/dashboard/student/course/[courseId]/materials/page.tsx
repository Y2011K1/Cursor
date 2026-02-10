import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { File, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { MaterialAccessButton } from "@/components/material-access-button"

interface PageProps {
  params: Promise<{ courseId: string }>
}

export default async function StudentMaterialsPage({ params }: PageProps) {
  const { courseId } = await params
  const profile = await requireRole("student")
  const supabase = await createClient()

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select(`
      course:courses ( id, name, subject, teacher:profiles!classrooms_teacher_id_fkey ( id, full_name ) )
    `)
    .eq("student_id", profile.id)
    .eq("course_id", courseId)
    .eq("is_active", true)
    .single()

  if (!enrollment?.course) notFound()

  const raw = enrollment.course as unknown
  const course = (Array.isArray(raw) ? raw[0] : raw) as { id: string; name: string; subject: string | null; teacher: { full_name: string } | null }

  const { data: materials } = await supabase
    .from("course_materials")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("order_index", { ascending: true })

  const list = materials || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button variant="ghost" size="sm" asChild className="text-slate-blue hover:text-deep-teal -ml-2">
              <Link href={`/dashboard/student?course=${courseId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="bg-gradient-to-r from-deep-teal/10 via-soft-mint/10 to-success-green/10 rounded-2xl p-6 border border-deep-teal/10">
            <h1 className="text-2xl md:text-3xl font-bold text-deep-teal mb-1">{course.name}</h1>
            {course.subject && <p className="text-slate-blue font-medium">Subject: {course.subject}</p>}
            <p className="text-slate-blue text-sm mt-1">Teacher: {course.teacher?.full_name ?? "Unknown"}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-deep-teal mb-4 flex items-center gap-2">
              <File className="h-5 w-5" />
              Course Materials
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.length > 0 ? (
                list.map((mat: any) => (
                  <Card key={mat.id} className="border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-deep-teal text-base">{mat.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <MaterialAccessButton
                          materialId={mat.id}
                          fileUrl={mat.file_url}
                          fileName={mat.title}
                          fileType={mat.file_type}
                          showView
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-none shadow-sm rounded-2xl bg-white/80">
                  <CardContent className="py-6 text-center text-slate-blue text-sm">
                    No materials in this course yet. Check back later.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
