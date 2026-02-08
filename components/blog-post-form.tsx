"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Category = { id: string; name: string; slug: string }
type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image_url: string | null
  category_id: string | null
  status: string
}

export function BlogPostForm({
  action,
  categories,
  post,
}: {
  action: (formData: FormData) => Promise<{ error: string | null; success?: boolean }>
  categories: Category[]
  post?: Post | null
}) {
  const router = useRouter()
  const [state, formAction] = useActionState(
    async (_: unknown, fd: FormData) => {
      const result = await action(fd)
      if (result.error) return { error: result.error, success: false }
      return { error: null, success: true }
    },
    null as { error: string; success?: boolean } | null
  )

  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => {
        router.back()
        router.refresh()
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [state?.success, router])

  return (
    <form action={formAction} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">Saved. Redirecting...</p>
      )}
      <div className="grid gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={post?.title}
            className="mt-1 rounded-xl"
            placeholder="Post title"
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            name="slug"
            required
            defaultValue={post?.slug}
            className="mt-1 rounded-xl"
            placeholder="my-first-post"
          />
        </div>
        <div>
          <Label htmlFor="excerpt">Excerpt (optional)</Label>
          <Textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            defaultValue={post?.excerpt ?? ""}
            className="mt-1 rounded-xl"
            placeholder="Short summary"
          />
        </div>
        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            name="content"
            required
            rows={12}
            defaultValue={post?.content ?? ""}
            className="mt-1 rounded-xl font-mono text-sm"
            placeholder="HTML or plain text"
          />
        </div>
        <div>
          <Label htmlFor="featured_image_url">Featured image URL (optional)</Label>
          <Input
            id="featured_image_url"
            name="featured_image_url"
            type="url"
            defaultValue={post?.featured_image_url ?? ""}
            className="mt-1 rounded-xl"
            placeholder="https://..."
          />
        </div>
        <div>
          <Label htmlFor="category_id">Category</Label>
          <select
            id="category_id"
            name="category_id"
            className="mt-1 w-full rounded-xl border border-input bg-background h-10 px-3 text-sm"
            defaultValue={post?.category_id ?? ""}
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Status</Label>
          <select
            name="status"
            className="mt-1 w-full rounded-xl border border-input bg-background h-10 px-3 text-sm"
            defaultValue={post?.status ?? "draft"}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" size="sm" className="rounded-xl">
          {post ? "Update post" : "Create post"}
        </Button>
        {post && (
          <Button type="button" size="sm" variant="outline" className="rounded-xl" asChild>
            <a href="/dashboard/admin/blog">Cancel</a>
          </Button>
        )}
      </div>
    </form>
  )
}
