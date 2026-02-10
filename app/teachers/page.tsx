import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/landing-header"
import { Avatar } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import Link from "next/link"

export const revalidate = 300

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const sort = typeof params.sort === "string" ? params.sort : "rating"
  const specialization = typeof params.specialization === "string" ? params.specialization : ""

  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name, created_at")
    .eq("role", "teacher")

  const teacherIds = (teachers || []).map((t: any) => t.id)
  const { data: coursesByTeacher } = teacherIds.length > 0
    ? await supabase
        .from("courses")
        .select("id, name, teacher_id")
        .in("teacher_id", teacherIds)
    : { data: [] }
  const courseByTeacherId = new Map(
    (coursesByTeacher || []).map((c: any) => [c.teacher_id, c])
  )
  const { data: teacherProfiles } = teacherIds.length > 0
    ? await supabase
        .from("teacher_profiles")
        .select("user_id, bio, specializations, years_experience, rating, total_ratings, featured, profile_picture_url")
        .in("user_id", teacherIds)
    : { data: [] }
  const profileMap = new Map(
    (teacherProfiles || []).map((p: any) => [p.user_id, p])
  )

  const list = (teachers || [])
    .map((t: any) => ({
      ...t,
      teacher_profile: profileMap.get(t.id),
      course: courseByTeacherId.get(t.id),
    }))
    .filter((t: any) => {
      if (specialization) {
        const specs = t.teacher_profile?.specializations as string[] | null
        return specs?.includes(specialization)
      }
      return true
    })
    .sort((a: any, b: any) => {
      const ra = a.teacher_profile?.rating ?? 0
      const rb = b.teacher_profile?.rating ?? 0
      if (sort === "rating") return Number(rb) - Number(ra)
      if (sort === "experience") {
        const ea = a.teacher_profile?.years_experience ?? 0
        const eb = b.teacher_profile?.years_experience ?? 0
        return eb - ea
      }
      return (a.full_name || "").localeCompare(b.full_name || "")
    })

  return (
    <div className="min-h-screen bg-light-sky">
      <LandingHeader />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-deep-teal mb-2">Meet Our Instructors</h1>
        <p className="text-slate-blue mb-8">Learn from industry professionals</p>
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-sm text-slate-blue mr-2 self-center">Sort:</span>
          <Link href="/teachers?sort=rating">
            <Button variant={sort === "rating" ? "default" : "outline"} size="sm">
              Highest rated
            </Button>
          </Link>
          <Link href="/teachers?sort=experience">
            <Button variant={sort === "experience" ? "default" : "outline"} size="sm">
              Most experienced
            </Button>
          </Link>
          <Link href="/teachers?sort=name">
            <Button variant={sort === "name" ? "default" : "outline"} size="sm">
              A-Z
            </Button>
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((teacher: any) => {
            const tp = teacher.teacher_profile
            const rating = tp?.rating ?? 0
            const totalRatings = tp?.total_ratings ?? 0
            return (
              <Card key={teacher.id} className="text-center overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="mx-auto flex justify-center">
                    <Avatar
                      name={teacher.full_name || "Instructor"}
                      src={tp?.profile_picture_url}
                      size="xl"
                      className="h-24 w-24 border-4 border-light-sky"
                    />
                  </div>
                  <p className="mt-4 font-semibold text-deep-teal">{teacher.full_name}</p>
                  {(tp?.specializations as string[])?.[0] && (
                    <span className="inline-block rounded-full bg-soft-mint/50 px-3 py-1 text-xs font-medium text-deep-teal mt-2">
                      {(tp.specializations as string[])[0]}
                    </span>
                  )}
                  <p className="mt-2 line-clamp-3 text-sm text-slate-blue">
                    {tp?.bio || "Expert instructor."}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-warning-yellow text-warning-yellow" />
                    <span>{Number(rating).toFixed(1)}</span>
                    {totalRatings > 0 && <span className="text-slate-blue">({totalRatings})</span>}
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-4 border-deep-teal text-deep-teal">
                    <Link href={`/teachers/${teacher.id}`}>View Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
        {list.length === 0 && (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center text-slate-blue">
              No instructors found.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
