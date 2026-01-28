import { redirect } from "next/navigation"
import { requireAuth, getCurrentProfile } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { ChangePasswordForm } from "@/components/change-password-form"
import { Lock } from "lucide-react"

export default async function SettingsPage() {
  const user = await requireAuth()
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole={profile.role} userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-deep-teal mb-2">
              Settings
            </h1>
            <p className="text-slate-blue">
              Manage your account settings
            </p>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-deep-teal flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
