import { redirect } from "next/navigation"
import { requireAuth, getCurrentProfile } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { ChangePasswordForm } from "@/components/change-password-form"
import { TeacherProfileForm } from "@/components/teacher-profile-form"
import { createClient } from "@/lib/supabase/server"
import { Lock, User } from "lucide-react"
import { DisplayNameForm } from "@/components/display-name-form"

export default async function SettingsPage() {
  const user = await requireAuth()
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect("/dashboard")
  }

  let teacherProfile: {
    profile_picture_url: string | null
    bio: string | null
    years_experience: number | null
    birthdate: string | null
    education: string | null
    teaching_philosophy: string | null
    linkedin_url: string | null
    twitter_url: string | null
    specializations: string[] | null
    qualifications: string[] | null
  } | null = null

  if (profile.role === "teacher" && user?.id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("teacher_profiles")
      .select("profile_picture_url, bio, years_experience, birthdate, education, teaching_philosophy, linkedin_url, twitter_url, specializations, qualifications")
      .eq("user_id", user.id)
      .single()
    if (data) {
      teacherProfile = {
        ...data,
        birthdate: data.birthdate ? String(data.birthdate).slice(0, 10) : null,
      }
    }
  }

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole={profile.role} userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
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
                <User className="h-5 w-5" />
                Display name
              </CardTitle>
              <CardDescription>
                Change how your name appears (students and teachers)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DisplayNameForm initialName={profile.full_name || ""} />
            </CardContent>
          </Card>

          {profile.role === "teacher" && (
            <TeacherProfileForm initial={teacherProfile} />
          )}

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
