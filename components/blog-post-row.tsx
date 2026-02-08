"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

type Post = { id: string; title: string; slug: string; status: string; published_at: string | null }

export function BlogPostRow({
  post,
  deleteAction,
}: {
  post: Post
  deleteAction: (id: string) => Promise<{ error?: string | null }>
}) {
  return (
    <li className="flex items-center justify-between p-3 rounded-lg border border-deep-teal/10 gap-3 flex-wrap">
      <div className="min-w-0">
        <span className="font-medium block truncate">{post.title}</span>
        <span
          className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
            post.status === "published"
              ? "bg-success-green/20 text-success-green"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {post.status}
        </span>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="outline" className="rounded-xl" asChild>
          <Link href={`/dashboard/admin/blog/${post.id}/edit`}>Edit</Link>
        </Button>
        <form
          action={async () => {
            await deleteAction(post.id)
          }}
          className="inline"
        >
          <Button type="submit" size="sm" variant="outline" className="rounded-xl text-error-red border-error-red/50">
            Remove
          </Button>
        </form>
      </div>
    </li>
  )
}
