import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminAnnouncementsPage() {
  await requireRole("admin")
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, type, is_active, start_date, end_date, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="admin" />
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-deep-teal">Announcements</h1>
              <p className="text-slate-blue">Manage banner announcements</p>
            </div>
          </div>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Active announcements</CardTitle>
            </CardHeader>
            <CardContent>
              {(!announcements || announcements.length === 0) ? (
                <p className="text-slate-500">No announcements. Add one via Supabase or a form.</p>
              ) : (
                <ul className="space-y-2">
                  {announcements.map((a: any) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-deep-teal/10"
                    >
                      <span className="font-medium">{a.title}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          a.is_active ? "bg-success-green/20 text-success-green" : "bg-slate-200"
                        }`}
                      >
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
