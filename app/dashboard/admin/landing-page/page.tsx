import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/admin"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Layout } from "lucide-react"
import { LandingPageAdminTabs } from "@/components/landing-page-admin-tabs"

export const dynamic = "force-dynamic"

export default async function AdminLandingPage() {
  await requireRole("admin")
  const supabase = await createClient()
  const adminClient = getAdminClient()

  // Auto-sync platform stats when admin views landing page (no manual button)
  await supabase.rpc("refresh_platform_stats").then(() => {})

  const [
    { data: announcements },
    { data: slides },
    { data: about },
    { data: testimonials },
    { data: platformStats },
  ] = await Promise.all([
    supabase.from("announcements").select("id, title, content, background_color, text_color, is_active").order("created_at", { ascending: false }),
    adminClient.from("homepage_slides").select("id, title, description, cta_text, cta_link, image_url, display_order, is_active").order("display_order", { ascending: true }),
    supabase.from("about_section").select("id, heading, subheading, vision, mission, content, image_url").limit(1).single(),
    adminClient.from("testimonials").select("id, student_name, student_role_or_course, rating, quote, display_order, is_active").order("display_order", { ascending: true }),
    supabase.from("platform_stats").select("stat_key, stat_value, stat_label, display_order").order("display_order", { ascending: true }),
  ])

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
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-deep-teal flex items-center gap-2">
                <Layout className="h-8 w-8" />
                Landing Page
              </h1>
              <p className="text-slate-blue">Manage announcements, hero slides, about section, testimonials, and stats</p>
            </div>
          </div>

          <LandingPageAdminTabs
            announcements={announcements || []}
            slides={slides || []}
            about={about ?? null}
            testimonials={testimonials || []}
            platformStats={platformStats || []}
          />
        </div>
      </div>
    </div>
  )
}
