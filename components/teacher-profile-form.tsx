"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User } from "lucide-react"
import { updateTeacherProfile } from "@/app/actions/teacher-profile"
import { createClient } from "@/lib/supabase/client"
import { Avatar } from "@/components/ui/avatar"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"

export function TeacherProfileForm({
  initial,
}: {
  initial: {
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
  } | null
}) {
  const [message, setMessage] = useState<"success" | "error" | null>(null)
  const [profilePictureUrl, setProfilePictureUrl] = useState(initial?.profile_picture_url ?? "")
  const [fullName, setFullName] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("full_name").eq("id", user.id).single().then(({ data }) => {
          setFullName(data?.full_name ?? "")
        })
      }
    })
  }, [])

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-deep-teal flex items-center gap-2">
          <User className="h-5 w-5" />
          Teacher Profile
        </CardTitle>
        <CardDescription>
          Your profile picture and info are shown to students and on the landing page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async (fd) => {
            const r = await updateTeacherProfile(fd)
            setMessage(r.error ? "error" : "success")
            if (!r.error) setProfilePictureUrl((fd.get("profile_picture_url") as string) || "")
          }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-medium text-deep-teal">Profile picture</p>
              <p className="text-xs text-slate-500 text-center max-w-[240px]">
                Upload or drag a square or rectangle photo. It will be cropped to fit on the landing page.
              </p>
              <ProfilePictureUpload
                name="profile_picture_url"
                defaultUrl={initial?.profile_picture_url}
                onUrlChange={(url) => setProfilePictureUrl(url ?? "")}
                square
                className="mx-auto"
              />
            </div>
            <div className="flex flex-col items-center gap-2 sm:ml-4">
              <span className="text-xs text-slate-500">Preview (as on landing page)</span>
              <div className="rounded-full overflow-hidden border-4 border-deep-teal/20 w-24 h-24 bg-deep-teal/10 flex items-center justify-center">
                <Avatar
                  name={fullName}
                  src={profilePictureUrl || undefined}
                  size="xl"
                  className="h-24 w-24 border-0"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" rows={4} defaultValue={initial?.bio ?? ""} className="mt-1" placeholder="Short bio for students" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="years_experience">Years of experience</Label>
              <Input id="years_experience" name="years_experience" type="number" min={0} defaultValue={initial?.years_experience ?? ""} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="birthdate">Birthdate (optional)</Label>
              <Input id="birthdate" name="birthdate" type="date" defaultValue={initial?.birthdate ?? ""} className="mt-1" />
            </div>
          </div>

          <div>
            <Label htmlFor="education">Education</Label>
            <Input id="education" name="education" defaultValue={initial?.education ?? ""} className="mt-1" placeholder="e.g. PhD in Mathematics" />
          </div>

          <div>
            <Label htmlFor="specializations">Specializations (comma-separated)</Label>
            <Input
              id="specializations"
              name="specializations"
              defaultValue={initial?.specializations?.join(", ") ?? ""}
              className="mt-1"
              placeholder="e.g. Algebra, Calculus"
            />
          </div>

          <div>
            <Label htmlFor="qualifications">Qualifications (comma-separated)</Label>
            <Input
              id="qualifications"
              name="qualifications"
              defaultValue={initial?.qualifications?.join(", ") ?? ""}
              className="mt-1"
              placeholder="e.g. Certified Teacher, Award 2020"
            />
          </div>

          <div>
            <Label htmlFor="teaching_philosophy">Teaching philosophy</Label>
            <Textarea
              id="teaching_philosophy"
              name="teaching_philosophy"
              rows={3}
              defaultValue={initial?.teaching_philosophy ?? ""}
              className="mt-1"
              placeholder="Your approach to teaching"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input id="linkedin_url" name="linkedin_url" type="url" defaultValue={initial?.linkedin_url ?? ""} className="mt-1" placeholder="https://linkedin.com/..." />
            </div>
            <div>
              <Label htmlFor="twitter_url">Twitter / X URL</Label>
              <Input id="twitter_url" name="twitter_url" type="url" defaultValue={initial?.twitter_url ?? ""} className="mt-1" placeholder="https://twitter.com/..." />
            </div>
          </div>

          {message === "success" && <p className="text-sm text-success-green">Profile saved.</p>}
          {message === "error" && <p className="text-sm text-error-red">Failed to save. Try again.</p>}

          <Button type="submit">Save profile</Button>
        </form>
      </CardContent>
    </Card>
  )
}
