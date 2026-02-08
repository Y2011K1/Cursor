import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { BlogPostForm } from "@/components/blog-post-form"
import { createPost } from "../actions"

export const dynamic = "force-dynamic"

export default async function NewBlogPostPage() {
  await requireRole("admin")
  const supabase = await createClient()
  const { data: categories } = await supabase.from("blog_categories").select("id, name, slug").order("name")

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
              <h1 className="text-3xl font-bold text-deep-teal">New post</h1>
              <p className="text-slate-blue">Add a blog post</p>
            </div>
          </div>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Create post</CardTitle>
              <p className="text-sm text-slate-500">Title, slug, excerpt, content. Featured image URL is optional.</p>
            </CardHeader>
            <CardContent>
              <BlogPostForm action={createPost} categories={categories || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
