import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  Users,
  BookOpen,
  GraduationCap,
  Star,
  Check,
  Quote,
  ArrowRight,
} from "lucide-react"
import { LandingHeader } from "@/components/landing-header"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { HomepageSlider } from "@/components/homepage-slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"

export const metadata = {
  title: "EduPlatform – Excellence in Education",
  description: "Join thousands of students learning from expert instructors. Structured courses, certificates, and a modern learning platform.",
  keywords: "online learning, education, courses, teachers, EduPlatform",
  openGraph: {
    title: "EduPlatform – Learn Smarter. Learn Better.",
    description: "Your journey to excellence starts here.",
  },
}

function formatStat(n: number | null | undefined): string {
  if (n == null) return "—"
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k+`
  return String(n)
}

export const revalidate = 60

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  const [aboutRes, statsRes, testimonialsRes] = await Promise.all([
    supabase.from("about_section").select("heading, subheading, vision, mission, content, image_url, stat_students, stat_courses, stat_teachers, stat_rating").limit(1).single(),
    supabase.from("platform_stats").select("stat_key, stat_value, stat_label, display_order").order("display_order", { ascending: true }),
    supabase.from("testimonials").select("id, student_name, student_role_or_course, rating, quote").eq("is_active", true).order("display_order", { ascending: true }).limit(6),
  ])

  const about = aboutRes.data ?? null
  const platformStatsRows = statsRes.data || []
  const testimonialsList = testimonialsRes.data || []

  const statsFromAbout = about
    ? [
        { value: formatStat(about.stat_students), label: "Active Students", icon: Users },
        { value: formatStat(about.stat_courses), label: "Courses", icon: BookOpen },
        { value: formatStat(about.stat_teachers), label: "Expert Instructors", icon: GraduationCap },
        { value: about.stat_rating != null && Number(about.stat_rating) > 0 ? `${Number(about.stat_rating).toFixed(1)}★` : "—", label: "Student Rating", icon: Star },
      ]
    : (() => {
        const s = (k: string) => platformStatsRows.find((r: any) => r.stat_key === k)
        return [
          { value: s("students")?.stat_value ?? "0", label: "Active Students", icon: Users },
          { value: s("courses")?.stat_value ?? "0", label: "Courses", icon: BookOpen },
          { value: s("teachers")?.stat_value ?? "0", label: "Expert Instructors", icon: GraduationCap },
          { value: s("rating")?.stat_value && Number(s("rating")?.stat_value) > 0 ? `${s("rating")!.stat_value}★` : "—", label: "Student Rating", icon: Star },
        ]
      })()
  const stats = statsFromAbout

  const testimonials = testimonialsList

  const { data: teachersData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "teacher")
  const teacherIds = (teachersData || []).map((t: any) => t.id)
  const [coursesRes, profilesRes] = await Promise.all([
    teacherIds.length > 0 ? supabase.from("courses").select("id, name, teacher_id").in("teacher_id", teacherIds) : { data: [] },
    teacherIds.length > 0 ? supabase.from("teacher_profiles").select("user_id, bio, specializations, years_experience, rating, total_ratings, profile_picture_url, featured").in("user_id", teacherIds) : { data: [] },
  ])
  const courseByTid = new Map((coursesRes.data || []).map((c: any) => [c.teacher_id, c]))
  const profileByTid = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]))
  const landingTeachers = (teachersData || [])
    .map((t: any) => ({
      id: t.id,
      full_name: t.full_name,
      course: courseByTid.get(t.id),
      teacher_profile: profileByTid.get(t.id),
    }))
    .sort((a: any, b: any) => (b.teacher_profile?.featured ? 1 : 0) - (a.teacher_profile?.featured ? 1 : 0) || (Number(b.teacher_profile?.rating ?? 0) - Number(a.teacher_profile?.rating ?? 0)))
    .slice(0, 4)

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
    .limit(6)

  const landingCourses = coursesData || []

  const { data: blogPostsData } = await supabase
    .from("blog_posts")
    .select(`
      id,
      title,
      slug,
      excerpt,
      featured_image_url,
      published_at,
      category:blog_categories(id, name, slug)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3)

  const blogPosts = blogPostsData || []

  return (
    <div className="min-h-screen bg-light-sky">
      <AnnouncementBanner />
      <LandingHeader />

      <main>
        {/* Hero */}
        <section
          className="relative overflow-hidden bg-gradient-to-br from-deep-teal via-[#3a6578] to-success-green px-4 py-20 md:py-28"
          aria-labelledby="hero-heading"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
          <div className="container relative mx-auto flex flex-col items-center text-center">
            <h1
              id="hero-heading"
              className="text-4xl font-bold tracking-tight text-white drop-shadow-sm md:text-5xl lg:text-6xl"
            >
              Learn Smarter. Learn Better.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
              Expert instructors and structured courses help you succeed
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white text-deep-teal hover:bg-white/90"
              >
                <Link href="/signup">Start Learning Now</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10"
              >
                <Link href="/#courses">Browse Courses</Link>
              </Button>
            </div>
            <div className="mt-12 w-full max-w-4xl">
              <HomepageSlider />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-deep-teal/10 bg-white px-4 py-12 md:py-16" aria-labelledby="stats-heading">
          <div className="container mx-auto">
            <h2 id="stats-heading" className="sr-only">
              Platform statistics
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {stats.map((item) => {
                const Icon = item.icon
                return (
                  <Card
                    key={item.label}
                    className="group border-deep-teal/20 bg-gradient-to-b from-white to-light-sky/50 transition-all hover:shadow-lg hover:shadow-deep-teal/10"
                  >
                    <CardContent className="flex flex-col items-center p-6 text-center">
                      <Icon className="h-10 w-10 text-deep-teal md:h-12 md:w-12" aria-hidden />
                      <span className="mt-2 text-2xl font-bold text-deep-teal md:text-3xl">{item.value}</span>
                      <span className="mt-1 text-sm text-slate-blue">{item.label}</span>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-20 px-4 py-16 md:py-24" aria-labelledby="about-heading">
          <div className="container mx-auto grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 id="about-heading" className="text-3xl font-bold text-deep-teal md:text-4xl">
                {about?.heading ?? "About EduPlatform"}
              </h2>
              {about?.subheading && (
                <p className="mt-2 text-lg text-slate-blue">{about.subheading}</p>
              )}
              <p className="mt-4 text-slate-blue">
                {about?.content ?? "We are a modern learning platform built to connect students with expert instructors and structured, outcome-focused courses."}
              </p>
              {(about?.vision || about?.mission) && (
                <ul className="mt-6 space-y-3">
                  {about.vision && (
                    <li className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-success-green" aria-hidden />
                      <span className="text-dark-text"><strong>Vision:</strong> {about.vision}</span>
                    </li>
                  )}
                  {about.mission && (
                    <li className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-success-green" aria-hidden />
                      <span className="text-dark-text"><strong>Mission:</strong> {about.mission}</span>
                    </li>
                  )}
                </ul>
              )}
              {!about?.vision && !about?.mission && (
                <ul className="mt-6 space-y-3">
                  {["Structured curricula designed for real-world skills", "Expert instructors with industry experience", "Track progress and earn certificates"].map((text, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-success-green" aria-hidden />
                      <span className="text-dark-text">{text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="relative hidden md:block">
              {about?.image_url ? (
                <img src={about.image_url} alt="" className="aspect-video w-full rounded-xl object-cover shadow-lg" />
              ) : (
                <div className="aspect-video rounded-xl bg-gradient-to-br from-soft-mint to-success-green/30 shadow-lg" aria-hidden />
              )}
            </div>
          </div>
        </section>

        {/* Courses Preview */}
        <section id="courses" className="scroll-mt-20 bg-white px-4 py-16 md:py-24" aria-labelledby="courses-heading">
          <div className="container mx-auto">
            <h2 id="courses-heading" className="text-3xl font-bold text-deep-teal md:text-4xl">
              Popular Courses
            </h2>
            <p className="mt-2 text-slate-blue">Start with our most-loved courses</p>
            {landingCourses.length > 0 ? (
              <>
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {landingCourses.map((course: any) => {
                    const teacher = Array.isArray(course.teacher) ? course.teacher[0] : course.teacher
                    return (
                      <Card
                        key={course.id}
                        className="overflow-hidden transition-all hover:shadow-lg hover:shadow-deep-teal/10"
                      >
                        <div className="h-40 bg-gradient-to-br from-deep-teal/20 to-soft-mint/40" />
                        <CardContent className="p-4">
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
                          <Button asChild variant="outline" className="mt-4 w-full border-deep-teal text-deep-teal">
                            <Link href="/signup">View Course</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                <div className="mt-10 text-center">
                  <Button asChild size="lg" className="bg-gradient-to-r from-deep-teal to-success-green text-white">
                    <Link href="/signup">Explore All Courses</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-10 rounded-xl border border-deep-teal/20 bg-light-sky/50 px-6 py-12 text-center">
                <p className="text-slate-blue">No courses yet. Check back soon.</p>
                <Button asChild size="lg" className="mt-4 bg-deep-teal text-white">
                  <Link href="/signup">Sign up to get notified</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Teachers */}
        <section id="teachers" className="scroll-mt-20 px-4 py-16 md:py-24" aria-labelledby="teachers-heading">
          <div className="container mx-auto">
            <h2 id="teachers-heading" className="text-3xl font-bold text-deep-teal md:text-4xl">
              Meet Our Expert Instructors
            </h2>
            <p className="mt-2 text-slate-blue">Learn from industry professionals</p>
            {landingTeachers.length > 0 ? (
              <>
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {landingTeachers.map((t: any) => {
                    const name = t.full_name ?? "Instructor"
                    const role = t.course?.name ?? t.teacher_profile?.specializations?.[0] ?? "Instructor"
                    const bio = t.teacher_profile?.bio ?? ""
                    const rating = t.teacher_profile?.rating ?? 0
                    return (
                      <Card key={t.id} className="text-center transition-all hover:shadow-lg">
                        <CardContent className="pt-6">
                          <div className="mx-auto">
                            <Avatar name={name} src={t.teacher_profile?.profile_picture_url} size="xl" className="h-24 w-24 border-4 border-light-sky" />
                          </div>
                          <p className="mt-4 font-semibold text-deep-teal">{name}</p>
                          <span className="inline-block rounded-full bg-soft-mint/50 px-3 py-1 text-xs font-medium text-deep-teal">
                            {role}
                          </span>
                          <p className="mt-2 line-clamp-3 text-sm text-slate-blue">{bio || "—"}</p>
                          {Number(rating) > 0 && (
                            <div className="mt-2 flex items-center justify-center gap-1 text-sm">
                              <Star className="h-4 w-4 fill-warning-yellow text-warning-yellow" aria-hidden />
                              <span>{Number(rating).toFixed(1)}</span>
                            </div>
                          )}
                          <Button asChild variant="outline" size="sm" className="mt-4 border-deep-teal text-deep-teal">
                            <Link href={`/teachers/${t.id}`}>View Profile</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                <div className="mt-10 text-center">
                  <Button asChild variant="outline" size="lg" className="border-deep-teal text-deep-teal">
                    <Link href="/teachers">Meet All Instructors</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-10 rounded-xl border border-deep-teal/20 bg-light-sky/50 px-6 py-12 text-center">
                <p className="text-slate-blue">No instructors yet. Check back soon.</p>
                <Button asChild variant="outline" size="lg" className="mt-4 border-deep-teal text-deep-teal">
                  <Link href="/teachers">View Teachers</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-white px-4 py-16 md:py-24" aria-labelledby="testimonials-heading">
          <div className="container mx-auto">
            <h2 id="testimonials-heading" className="text-3xl font-bold text-deep-teal md:text-4xl">
              What Our Students Say
            </h2>
            {testimonials.length > 0 ? (
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {testimonials.map((t: any) => (
                  <Card key={t.id} className="relative overflow-hidden">
                    <Quote className="absolute right-4 top-4 h-10 w-10 text-deep-teal/10" aria-hidden />
                    <CardContent className="p-6">
                      <div className="flex gap-1 text-warning-yellow">
                        {Array.from({ length: t.rating ?? 5 }).map((_, j) => (
                          <Star key={j} className="h-4 w-4 fill-current" aria-hidden />
                        ))}
                      </div>
                      <p className="mt-4 text-slate-blue">&ldquo;{t.quote}&rdquo;</p>
                      <p className="mt-4 font-medium text-deep-teal">{t.student_name}</p>
                      <p className="text-sm text-slate-blue">{t.student_role_or_course ?? ""}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-xl border border-deep-teal/20 bg-light-sky/50 px-6 py-12 text-center">
                <p className="text-slate-blue">No testimonials yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Blog */}
        <section id="blog" className="scroll-mt-20 px-4 py-16 md:py-24" aria-labelledby="blog-heading">
          <div className="container mx-auto">
            <h2 id="blog-heading" className="text-3xl font-bold text-deep-teal md:text-4xl">
              Latest from Our Blog
            </h2>
            {blogPosts.length > 0 ? (
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {blogPosts.map((post: any) => {
                  const category = Array.isArray(post.category) ? post.category[0] : post.category
                  return (
                    <Card key={post.id} className="overflow-hidden transition-all hover:shadow-lg">
                      {post.featured_image_url ? (
                        <img src={post.featured_image_url} alt="" className="h-40 w-full object-cover" />
                      ) : (
                        <div className="h-40 bg-gradient-to-br from-soft-mint/50 to-success-green/20" />
                      )}
                      <CardContent className="p-4">
                        {category?.name && (
                          <span className="rounded-full bg-deep-teal/10 px-2 py-0.5 text-xs font-medium text-deep-teal">
                            {category.name}
                          </span>
                        )}
                        <h3 className="mt-2 font-semibold text-deep-teal">{post.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-blue">{post.excerpt || ""}</p>
                        <p className="mt-2 text-xs text-slate-blue">
                          {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
                        </p>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-deep-teal hover:underline"
                        >
                          Read More <ArrowRight className="h-4 w-4" />
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="mt-10 rounded-xl border border-deep-teal/20 bg-light-sky/50 px-6 py-12 text-center">
                <p className="text-slate-blue">No blog posts yet.</p>
                <Link href="/blog" className="mt-2 inline-block text-sm font-medium text-deep-teal hover:underline">
                  Visit Blog
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Final CTA */}
        <section
          className="relative overflow-hidden bg-gradient-to-r from-deep-teal via-[#3a6578] to-success-green px-4 py-20 md:py-28"
          aria-labelledby="cta-heading"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 20V40H20L40 20\'/%3E%3C/g%3E%3C/svg%3E')]" />
          <div className="container relative mx-auto text-center">
            <h2 id="cta-heading" className="text-3xl font-bold text-white md:text-4xl">
              Start Your Learning Journey With EduPlatform
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Join thousands of students building their future today
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-white text-deep-teal hover:bg-white/90">
                <Link href="/signup">Sign Up Now</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10"
              >
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-deep-teal/10 bg-white px-4 py-12 md:py-16">
          <div className="container mx-auto grid gap-8 md:grid-cols-4">
            <div>
              <p className="font-bold text-deep-teal">EduPlatform</p>
              <p className="mt-2 text-sm text-slate-blue">Learn smarter. Learn better.</p>
            </div>
            <div>
              <p className="font-semibold text-deep-teal">Quick Links</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-blue">
                <li><Link href="/#about" className="hover:text-deep-teal">About</Link></li>
                <li><Link href="/#courses" className="hover:text-deep-teal">Courses</Link></li>
                <li><Link href="/#teachers" className="hover:text-deep-teal">Teachers</Link></li>
                <li><Link href="/#blog" className="hover:text-deep-teal">Blog</Link></li>
                <li><Link href="/login" className="hover:text-deep-teal">Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-deep-teal">Legal</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-blue">
                <li><Link href="/login" className="hover:text-deep-teal">Privacy</Link></li>
                <li><Link href="/login" className="hover:text-deep-teal">Terms</Link></li>
                <li><Link href="/login" className="hover:text-deep-teal">Refund Policy</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-deep-teal">Stay connected</p>
              <p className="mt-2 text-sm text-slate-blue">Newsletter signup (coming soon)</p>
            </div>
          </div>
          <div className="container mx-auto mt-10 border-t border-deep-teal/10 pt-8 text-center text-sm text-slate-blue">
            © {new Date().getFullYear()} EduPlatform. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  )
}
