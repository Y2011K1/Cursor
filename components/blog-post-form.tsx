"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react"

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
  const [isUploading, setIsUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(post?.featured_image_url || null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState(post?.featured_image_url || "")
  const [isDragging, setIsDragging] = useState(false)
  
  const [state, formAction] = useActionState(
    async (_: unknown, fd: FormData) => {
      // Set the image URL in form data if we have one
      if (imageUrl) {
        fd.set("featured_image_url", imageUrl)
      }
      const result = await action(fd)
      if (result?.error) return { error: result.error, success: false }
      return { error: null, success: true }
    },
    { error: null, success: false }
  )

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be less than 5MB")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set("folder", "blog")
      const res = await fetch("/api/upload/image", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error || "Failed to upload image")
        return
      }
      setImageUrl(data.url)
      setImagePreview(data.url)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

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
          <Label htmlFor="featured_image_url">Featured Image</Label>
          <div className="space-y-3 mt-1">
            {imagePreview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-deep-teal/20">
                <img
                  src={imagePreview}
                  alt="Blog preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageUrl("")
                    setImagePreview(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? "border-deep-teal bg-deep-teal/5"
                  : "border-gray-300 hover:border-deep-teal/50"
              }`}
            >
              <ImageIcon className="h-12 w-12 mx-auto mb-2 text-deep-teal/50" />
              <p className="text-sm text-slate-600 mb-2">
                {isDragging ? "Drop image here" : "Drag and drop an image here, or"}
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
            {uploadError && (
              <p className="text-sm text-red-600">{uploadError}</p>
            )}
            <Input
              id="featured_image_url"
              name="featured_image_url"
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value)
                setImagePreview(e.target.value || null)
              }}
              className="rounded-xl"
              placeholder="Or enter image URL directly"
            />
          </div>
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
