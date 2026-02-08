import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/landing-header"
import { Avatar } from "@/components/ui/avatar"
import { Star, BookOpen, Users, Award, Linkedin, Twitter } from "lucide-react"
import Link from "next/link"

export const revalidate = 60

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ teacherId: string }>
}) {
  const { teacherId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", teacherId)
    .eq("role", "teacher")
    .single()

  if (!profile) notFound()

  const { data: teacherProfile } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("user_id", teacherId)
    .single()

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, description, subject, rating, total_ratings")
    .eq("teacher_id", teacherId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const tp = teacherProfile
  const rating = tp?.rating ?? 0
  const totalRatings = tp?.total_ratings ?? 0
  const specializations = (tp?.specializations as string[]) || []
  const qualifications = (tp?.qualifications as string[]) || []

  return (
    <div className="min-h-screen bg-light-sky">
      <LandingHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-deep-teal/10 to-soft-mint/20 p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <Avatar
                  name={profile.full_name || "Instructor"}
                  src={tp?.profile_picture_url}
                  size="xl"
                  className="h-32 w-32 border-4 border-white shadow-md"
                />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-deep-teal">{profile.full_name}</h1>
                  {specializations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {specializations.map((s: string) => (
                        <span
                          key={s}
                          className="rounded-full bg-deep-teal/20 px-3 py-1 text-sm font-medium text-deep-teal"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-4 text-slate-blue">
                    <span className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-warning-yellow text-warning-yellow" />
                      {Number(rating).toFixed(1)}
                      {totalRatings > 0 && ` (${totalRatings} reviews)`}
                    </span>
                    {tp?.years_experience != null && (
                      <span className="flex items-center gap-1">
                        <Award className="h-5 w-5" />
                        {tp.years_experience} years experience
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    {tp?.linkedin_url && (
                      <a
                        href={tp.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-deep-teal/10 text-deep-teal hover:bg-deep-teal/20"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                    {tp?.twitter_url && (
                      <a
                        href={tp.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-deep-teal/10 text-deep-teal hover:bg-deep-teal/20"
                        aria-label="Twitter"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-deep-teal">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-blue">{tp?.bio || "No bio provided."}</p>
              {tp?.education && (
                <>
                  <h3 className="font-semibold text-deep-teal">Education</h3>
                  <p className="text-slate-blue">{tp.education}</p>
                </>
              )}
              {tp?.birthdate && (
                <p className="text-slate-blue">
                  <span className="font-medium text-deep-teal">Birthdate:</span>{" "}
                  {new Date(tp.birthdate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
              {tp?.teaching_philosophy && (
                <>
                  <h3 className="font-semibold text-deep-teal">Teaching philosophy</h3>
                  <p className="text-slate-blue">{tp.teaching_philosophy}</p>
                </>
              )}
              {qualifications.length > 0 && (
                <>
                  <h3 className="font-semibold text-deep-teal">Qualifications</h3>
                  <ul className="list-disc list-inside text-slate-blue space-y-1">
                    {qualifications.map((q: string) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>

          {courses && courses.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-deep-teal flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {courses.map((course: any) => (
                    <Link
                      key={course.id}
                      href={`/dashboard/student/classroom/${course.id}`}
                      className="block p-4 rounded-lg border border-deep-teal/20 hover:bg-deep-teal/5 transition-colors"
                    >
                      <p className="font-medium text-deep-teal">{course.name}</p>
                      {course.subject && (
                        <p className="text-sm text-slate-blue">{course.subject}</p>
                      )}
                      {(course.rating > 0 || course.total_ratings > 0) && (
                        <span className="flex items-center gap-1 text-sm mt-1">
                          <Star className="h-4 w-4 fill-warning-yellow text-warning-yellow" />
                          {Number(course.rating).toFixed(1)} ({course.total_ratings})
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
