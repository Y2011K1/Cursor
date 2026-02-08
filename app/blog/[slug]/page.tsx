import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { LandingHeader } from "@/components/landing-header"
import { Avatar } from "@/components/ui/avatar"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const revalidate = 60

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from("blog_posts")
    .select(`
      *,
      category:blog_categories(id, name, slug),
      author:profiles(id, full_name)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!post) notFound()

  const [relatedRes, linksRes] = await Promise.all([
    supabase.from("blog_posts").select("id, title, slug").eq("status", "published").neq("id", post.id).limit(3),
    supabase.from("blog_post_links").select("id, link_type, title, url").eq("blog_post_id", post.id).order("display_order", { ascending: true }),
  ])
  const related = relatedRes.data || []
  const postLinks = linksRes.data || []

  return (
    <div className="min-h-screen bg-light-sky">
      <LandingHeader />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-deep-teal hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>
        <article>
          {post.category?.name && (
            <span className="rounded-full bg-deep-teal/10 px-2 py-0.5 text-xs font-medium text-deep-teal">
              {post.category.name}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-deep-teal mt-2">{post.title}</h1>
          <div className="flex items-center gap-3 mt-4 text-slate-blue">
            {post.author && (
              <span className="flex items-center gap-2">
                <Avatar name={post.author.full_name || "Author"} size="sm" />
                {post.author.full_name}
              </span>
            )}
            <span className="text-sm">
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString()
                : ""}
            </span>
          </div>
          {post.featured_image_url && (
            <div className="mt-6 aspect-video rounded-lg overflow-hidden bg-deep-teal/10">
              <img
                src={post.featured_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div
            className="mt-8 prose prose-deep-teal max-w-none text-slate-blue"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />
        </article>
        {postLinks.length > 0 && (
          <section className="mt-12 pt-8 border-t border-deep-teal/20">
            <h2 className="text-xl font-bold text-deep-teal mb-4">Related links</h2>
            <ul className="space-y-2">
              {postLinks.map((link: any) => (
                <li key={link.id}>
                  {link.url.startsWith("http") ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-deep-teal hover:underline">
                      {link.title}
                      <span className="text-xs text-slate-500 ml-2 capitalize">({link.link_type})</span>
                    </a>
                  ) : (
                    <Link href={link.url} className="text-deep-teal hover:underline">
                      {link.title}
                      <span className="text-xs text-slate-500 ml-2 capitalize">({link.link_type})</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t border-deep-teal/20">
            <h2 className="text-xl font-bold text-deep-teal mb-4">Related posts</h2>
            <ul className="space-y-2">
              {related.map((p: any) => (
                <li key={p.id}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-deep-teal hover:underline"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
