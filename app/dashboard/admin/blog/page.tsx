import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { deletePost } from "./actions"
import { BlogPostRow } from "@/components/blog-post-row"
import { BlogCategoryForm } from "@/components/blog-category-form"

export const dynamic = "force-dynamic"

export default async function AdminBlogPage() {
  await requireRole("admin")
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, status, published_at, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="admin" />
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-deep-teal">Blog</h1>
              <p className="text-slate-blue">Manage blog posts</p>
            </div>
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/admin/blog/new">Add post</Link>
            </Button>
          </div>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Add category</CardTitle>
              <p className="text-sm text-slate-500">Create a category to assign to blog posts.</p>
            </CardHeader>
            <CardContent>
              <BlogCategoryForm />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Posts</CardTitle>
              <p className="text-sm text-slate-500">
                Add, edit, or remove posts. Optional featured image URL and category.
              </p>
            </CardHeader>
            <CardContent>
              {(!posts || posts.length === 0) ? (
                <p className="text-slate-500">No posts yet. Add one to get started.</p>
              ) : (
                <ul className="space-y-2">
                  {posts.map((p: any) => (
                    <BlogPostRow key={p.id} post={p} deleteAction={deletePost} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
