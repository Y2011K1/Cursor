import { createClient } from "@/lib/supabase/server"
import { LandingHeader } from "@/components/landing-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Star } from "lucide-react"

export const revalidate = 60
export const metadata = {
  title: "Courses – EduPlatform",
  description: "Browse our courses and start learning.",
}

export default async function CoursesPage() {
  const supabase = await createClient()

  const { data: coursesData } = await supabase
    .from("courses")
    .select(`
      id,
      name,
      description,
      rating,
      total_ratings,
      teacher:profiles!courses_teacher_id_fkey ( id, full_name )
    `)
    .eq("is_active", true)
    .order("rating", { ascending: false })
    .limit(24)

  const courses = coursesData || []

  return (
    <div className="min-h-screen bg-light-sky">
      <LandingHeader />
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-7xl">
        <Button
          variant="ghost"
          asChild
          className="mb-6 -ml-2 text-deep-teal transition-colors duration-200 hover:bg-deep-teal/10"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <h1 className="text-3xl font-bold text-deep-teal md:text-4xl mb-2">
          Courses
        </h1>
        <p className="text-slate-blue text-lg mb-10">
          Start with our most-loved courses
        </p>

        {courses.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: any) => {
              const teacher = Array.isArray(course.teacher) ? course.teacher[0] : course.teacher
              return (
                <Card
                  key={course.id}
                  className="overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:shadow-deep-teal/10 border-0 shadow-md"
                >
                  <div className="h-40 bg-gradient-to-br from-deep-teal/20 to-soft-mint/40 transition-opacity duration-300" />
                  <CardContent className="p-5">
                    <p className="font-semibold text-deep-teal">{course.name}</p>
                    <p className="mt-1 text-sm text-slate-blue">{teacher?.full_name ?? "Instructor"}</p>
                    {(course.rating != null && Number(course.rating) > 0) && (
                      <div className="mt-2 flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-warning-yellow text-warning-yellow" aria-hidden />
                        <span className="font-medium">{Number(course.rating).toFixed(1)}</span>
                        {course.total_ratings > 0 && (
                          <span className="text-slate-500">({course.total_ratings})</span>
                        )}
                      </div>
                    )}
                    <p className="mt-2 line-clamp-2 text-sm text-slate-blue">{course.description || "—"}</p>
                    <Button
                      asChild
                      variant="outline"
                      className="mt-4 w-full border-deep-teal text-deep-teal transition-colors duration-200 hover:bg-deep-teal/10"
                    >
                      <Link href="/signup">View Course</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-deep-teal/20 bg-white/80 px-6 py-12 text-center transition-all duration-300">
            <p className="text-slate-blue">No courses yet. Check back soon.</p>
            <Button asChild size="lg" className="mt-4 bg-deep-teal text-white">
              <Link href="/signup">Sign up to get notified</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
