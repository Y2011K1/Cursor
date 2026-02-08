import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminSlidesPage() {
  await requireRole("admin")
  const supabase = await createClient()

  const { data: slides } = await supabase
    .from("homepage_slides")
    .select("id, title, display_order, is_active, created_at")
    .order("display_order", { ascending: true })

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
              <h1 className="text-3xl font-bold text-deep-teal">Homepage slides</h1>
              <p className="text-slate-blue">Manage hero carousel slides</p>
            </div>
          </div>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Slides (by order)</CardTitle>
            </CardHeader>
            <CardContent>
              {(!slides || slides.length === 0) ? (
                <p className="text-slate-500">No slides. Add via Supabase.</p>
              ) : (
                <ul className="space-y-2">
                  {slides.map((s: any) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-deep-teal/10"
                    >
                      <span className="font-medium">{s.title}</span>
                      <span className="text-xs text-slate-500">
                        Order: {s.display_order} • {s.is_active ? "Active" : "Inactive"}
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
