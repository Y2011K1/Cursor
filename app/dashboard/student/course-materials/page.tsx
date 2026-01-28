import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { File, ArrowLeft, Download, FileText, Eye } from "lucide-react"
import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import { MaterialAccessButton } from "@/components/material-access-button"

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CourseMaterialsPage() {
  noStore() // Prevent caching
  const profile = await requireRole("student")
  const supabase = await createClient()

  // Get student's enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
      classroom:classrooms!inner (
        id,
        name,
        subject,
        is_active
      )
    `)
    .eq("student_id", profile.id)
    .eq("is_active", true)
  
  const activeEnrollments = enrollments?.filter((e: any) => e.classroom?.is_active === true) || []
  const classroomIds = activeEnrollments?.map((e: any) => e.classroom?.id).filter(Boolean) || []

  // Get all course materials - RLS will filter by enrollment
  const { data: materials, error: materialsError } = await supabase
    .from("course_materials")
    .select(`
      *,
      classroom:classrooms!inner (
        id,
        name,
        subject
      )
    `)
    .eq("is_published", true)
    .order("order_index", { ascending: true })

  if (materialsError) {
    console.error("Error fetching course materials:", materialsError)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-sky via-white to-light-sky">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/student">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-deep-teal flex items-center gap-2">
                <File className="h-8 w-8" />
                Course Materials
              </h1>
              <p className="text-slate-blue mt-1">
                {materials?.length || 0} material{materials?.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>

          {materials && materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material: any) => {
                const classroom = material.classroom
                
                return (
                  <Card 
                    key={material.id}
                    className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white group"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                      <CardTitle className="text-lg text-deep-teal group-hover:text-deep-teal/80 transition-colors mb-1">
                        {material.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {classroom?.name} • {classroom?.subject}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {material.description && (
                        <p className="text-sm text-slate-blue line-clamp-2">
                          {material.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-blue">
                        <span>{material.file_type || 'File'}</span>
                        {material.file_size && (
                          <span>{(material.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <MaterialAccessButton
                          materialId={material.id}
                          fileUrl={material.file_url}
                          fileName={material.file_name || material.title}
                          fileType={material.file_type}
                          showView={true}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-8 text-center">
                <File className="h-12 w-12 text-slate-blue/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-deep-teal mb-2">No Course Materials</h3>
                <p className="text-slate-blue">
                  No course materials are available at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
