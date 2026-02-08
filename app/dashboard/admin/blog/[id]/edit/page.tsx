import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { BlogPostForm } from "@/components/blog-post-form"
import { BlogPostLinksEditor } from "@/components/blog-post-links-editor"
import { updatePost } from "../../actions"

export const dynamic = "force-dynamic"

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("admin")
  const { id } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, content, featured_image_url, category_id, status")
    .eq("id", id)
    .single()
  if (!post) notFound()

  const { data: categories } = await supabase.from("blog_categories").select("id, name, slug").order("name")
  const { data: postLinks } = await supabase
    .from("blog_post_links")
    .select("id, link_type, title, url, display_order")
    .eq("blog_post_id", id)
    .order("display_order", { ascending: true })

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="admin" />
      <div className="p-6 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-deep-teal">Edit post</h1>
              <p className="text-slate-blue">{post.title}</p>
            </div>
          </div>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Edit post</CardTitle>
              <p className="text-sm text-slate-500">Update title, slug, content, and optional featured image.</p>
            </CardHeader>
            <CardContent>
              <BlogPostForm action={updatePost} categories={categories || []} post={post} />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Links on this post</CardTitle>
              <p className="text-sm text-slate-500">Add teacher, student, page, or image links; reorder or remove them.</p>
            </CardHeader>
            <CardContent>
              <BlogPostLinksEditor blogPostId={id} links={postLinks || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
