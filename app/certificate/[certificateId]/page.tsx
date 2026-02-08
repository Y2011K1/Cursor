import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Award } from "lucide-react"
import Link from "next/link"

export const revalidate = 60

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>
}) {
  const { certificateId } = await params
  const supabase = await createClient()

  const { data: cert } = await supabase
    .from("certificates")
    .select(`
      id,
      student_id,
      certificate_number,
      issued_date,
      completion_date,
      final_score,
      course:courses(name)
    `)
    .eq("id", certificateId)
    .single()

  let studentName = "Student"
  if (cert?.student_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", cert.student_id)
      .single()
    studentName = profile?.full_name || studentName
  }

  if (!cert) notFound()

  const course = Array.isArray((cert as any).course) ? (cert as any).course[0] : (cert as any).course
  const courseName = course?.name ?? "Course"

  return (
    <div className="min-h-screen bg-light-sky flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-deep-teal to-success-green p-6 text-center text-white">
          <Award className="h-16 w-16 mx-auto mb-2 opacity-90" />
          <h1 className="text-2xl font-bold">EduPlatform</h1>
          <p className="text-white/90 text-sm">Certificate of Completion</p>
        </div>
        <CardContent className="p-8 space-y-6">
          <div>
            <p className="text-sm text-slate-500">This certifies that</p>
            <p className="text-xl font-bold text-deep-teal">
              {studentName}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">has completed</p>
            <p className="text-lg font-semibold text-deep-teal">
              {courseName}
            </p>
          </div>
          <div className="flex justify-between text-sm text-slate-600 border-t pt-4">
            <span>
              Date:{" "}
              {cert.completion_date || cert.issued_date
                ? new Date(cert.completion_date || cert.issued_date).toLocaleDateString()
                : "—"}
            </span>
            {cert.final_score != null && (
              <span>Score: {cert.final_score}%</span>
            )}
          </div>
          <p className="text-xs text-slate-500 text-center">
            Certificate ID: {cert.certificate_number}
          </p>
          <div className="text-center">
            <Link
              href="/"
              className="text-sm font-medium text-deep-teal hover:underline"
            >
              EduPlatform
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
