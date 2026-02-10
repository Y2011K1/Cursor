import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { LandingHeader } from "@/components/landing-header"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const revalidate = 300

export default async function BlogPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
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
    .limit(24)

  return (
    <div className="min-h-screen bg-light-sky">
      <LandingHeader />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-deep-teal mb-2">Blog</h1>
        <p className="text-slate-blue mb-8">Tips, industry news, and updates</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(posts || []).map((post: any) => (
            <Card key={post.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all">
              {post.featured_image_url && (
                <div className="aspect-video bg-deep-teal/10 relative overflow-hidden">
                  <img
                    src={post.featured_image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              {!post.featured_image_url && (
                <div className="aspect-video bg-gradient-to-br from-soft-mint/50 to-success-green/20" />
              )}
              <CardContent className="p-4">
                {post.category?.name && (
                  <span className="rounded-full bg-deep-teal/10 px-2 py-0.5 text-xs font-medium text-deep-teal">
                    {post.category.name}
                  </span>
                )}
                <h2 className="mt-2 font-semibold text-deep-teal line-clamp-2">{post.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-slate-blue">{post.excerpt}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString()
                    : ""}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-deep-teal hover:underline"
                >
                  Read more <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        {(!posts || posts.length === 0) && (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center text-slate-blue">
              No posts yet. Check back soon.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
