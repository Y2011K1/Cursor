import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Award, ArrowLeft, Download } from "lucide-react"
import Link from "next/link"

export const revalidate = 0

export default async function CertificatesPage() {
  const profile = await requireRole("student")
  const supabase = await createClient()

  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      id,
      certificate_number,
      issued_date,
      completion_date,
      final_score,
      certificate_url,
      course:courses(id, name)
    `)
    .eq("student_id", profile.id)
    .order("issued_date", { ascending: false })

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/student">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-deep-teal">My Certificates</h1>
              <p className="text-slate-blue">Your earned course certificates</p>
            </div>
          </div>

          {(!certificates || certificates.length === 0) ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center">
                <Award className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">You haven’t earned any certificates yet.</p>
                <p className="text-sm text-slate-500 mt-1">
                  Complete courses to receive certificates.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {certificates.map((cert: any) => (
                <Card key={cert.id} className="border-0 shadow-md overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-deep-teal">
                      <Award className="h-6 w-6" />
                      <CardTitle className="text-lg">{cert.course?.name || "Course"}</CardTitle>
                    </div>
                    <p className="text-xs text-slate-500">
                      #{cert.certificate_number}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-slate-600">
                      Completed:{" "}
                      {cert.completion_date
                        ? new Date(cert.completion_date).toLocaleDateString()
                        : cert.issued_date
                          ? new Date(cert.issued_date).toLocaleDateString()
                          : "—"}
                    </p>
                    {cert.final_score != null && (
                      <p className="text-sm text-slate-600">
                        Final score: {cert.final_score}%
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button asChild size="sm" variant="outline" className="border-deep-teal text-deep-teal">
                        <Link href={`/certificate/${cert.id}`}>View</Link>
                      </Button>
                      {cert.certificate_url && (
                        <Button asChild size="sm">
                          <a
                            href={cert.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
