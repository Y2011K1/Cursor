import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { EnrollButton } from "@/components/enroll-button"
import { Users, GraduationCap, Star, Clock, Award } from "lucide-react"
import Link from "next/link"
import { BrowseCoursesFilters } from "./browse-courses-filters"

export const revalidate = 60

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function BrowseCoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const profile = await requireRole("student")
  const supabase = await createClient()
  const params = await searchParams

  const specialization = typeof params.specialization === "string" ? params.specialization : undefined
  const difficulty = typeof params.difficulty === "string" ? params.difficulty : undefined
  const sort = typeof params.sort === "string" ? params.sort : "newest"
  const featured = params.featured === "true"
  const certification = params.certification === "true"

  let query = supabase
    .from("courses")
    .select(`
      *,
      teacher:profiles!classrooms_teacher_id_fkey (
        id,
        full_name
      )
    `)
    .eq("is_active", true)

  if (specialization) query = query.eq("specialization", specialization)
  if (difficulty) query = query.eq("difficulty_level", difficulty)
  if (featured) query = query.eq("featured", true)
  if (certification) query = query.eq("certification_available", true)

  switch (sort) {
    case "rating":
      query = query.order("rating", { ascending: false })
      break
    case "popular":
      query = query.order("popularity_score", { ascending: false })
      break
    case "name":
      query = query.order("name", { ascending: true })
      break
    default:
      query = query.order("created_at", { ascending: false })
  }

  const { data: courses, error: coursesError } = await query

  if (coursesError) {
    console.error("Browse courses query error:", coursesError)
  }

  const courseList = courses ?? []

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", profile.id)
    .eq("is_active", true)

  const enrolledSet = new Set(enrollments?.map((e) => e.course_id) || [])
  const courseIds = courseList.map((c) => c.id)
  const { data: counts } = courseIds.length > 0
    ? await supabase
        .from("enrollments")
        .select("course_id")
        .in("course_id", courseIds)
        .eq("is_active", true)
    : { data: [] }
  const countsMap = new Map<string, number>()
  counts?.forEach((e: { course_id: string }) => {
    countsMap.set(e.course_id, (countsMap.get(e.course_id) || 0) + 1)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-6 md:p-8 flex-1">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 shrink-0">
            <BrowseCoursesFilters searchParams={params} />
          </aside>
          <main className="flex-1">
            <h1 className="text-3xl font-bold text-deep-teal mb-2">Browse Courses</h1>
            <p className="text-slate-blue mb-6">Filter and sort to find your next course</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseList.map((course: any) => {
                const isEnrolled = enrolledSet.has(course.id)
                const current = countsMap.get(course.id) || 0
                const isFull = current >= (course.max_students ?? 50)
                const rating = course.rating ?? 0
                const totalRatings = course.total_ratings ?? 0

                return (
                  <Card
                    key={course.id}
                    className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="relative h-40 bg-gradient-to-br from-deep-teal/20 to-soft-mint/40">
                      {course.featured && (
                        <span className="absolute top-2 left-2 rounded-full bg-warning-yellow px-2 py-0.5 text-xs font-semibold text-white">
                          Featured
                        </span>
                      )}
                      {course.thumbnail_url && (
                        <img
                          src={course.thumbnail_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-deep-teal shrink-0" />
                        {course.name}
                      </CardTitle>
                      <CardDescription>
                        {course.teacher?.full_name || "Instructor"}
                      </CardDescription>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-warning-yellow text-warning-yellow" />
                          {Number(rating).toFixed(1)}
                          {totalRatings > 0 && ` (${totalRatings})`}
                        </span>
                        {course.difficulty_level && (
                          <span className="rounded-full bg-soft-mint/50 px-2 py-0.5 text-xs capitalize">
                            {course.difficulty_level}
                          </span>
                        )}
                        {course.estimated_duration_hours && (
                          <span className="flex items-center gap-1 text-xs text-slate-blue">
                            <Clock className="h-3 w-3" />
                            {course.estimated_duration_hours}h
                          </span>
                        )}
                        {course.certification_available && (
                          <Award className="h-4 w-4 text-success-green" aria-label="Certificate" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-slate-blue line-clamp-2 mb-4">
                        {course.description || course.subject || "No description"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-blue mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {current} / {course.max_students} students
                        </span>
                      </div>
                      {isEnrolled ? (
                        <Button className="w-full" disabled>
                          Already Enrolled
                        </Button>
                      ) : isFull ? (
                        <Button className="w-full" variant="outline" disabled>
                          Full
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button asChild variant="outline" className="flex-1 border-deep-teal text-deep-teal">
                            <Link href={`/dashboard/student/classroom/${course.id}`}>View</Link>
                          </Button>
                          <EnrollButton courseId={course.id} studentId={profile.id} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            {courseList.length === 0 && (
              <Card className="border-0 shadow-md">
                <CardContent className="py-12 text-center text-slate-blue">
                  {coursesError
                    ? "Could not load courses. Please refresh the page or try again later."
                    : "No courses match your filters. Try adjusting filters or check back later—teachers can add courses from the admin dashboard."}
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  )
}
