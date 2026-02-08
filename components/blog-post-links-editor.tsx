"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createBlogPostLink,
  deleteBlogPostLink,
  reorderBlogPostLink,
} from "@/app/dashboard/admin/blog/actions"
import { ChevronUp, ChevronDown } from "lucide-react"

const LINK_TYPES = [
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
  { value: "page", label: "Page" },
  { value: "image", label: "Image" },
] as const

type LinkRow = { id: string; link_type: string; title: string; url: string; display_order: number }

export function BlogPostLinksEditor({
  blogPostId,
  links,
}: {
  blogPostId: string
  links: LinkRow[]
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Links (teacher, student, page, or image)</Label>
        <p className="text-sm text-slate-500 mt-0.5">
          Add links to this post (e.g. teacher profile, student page, another page, or image URL). You can reorder or remove them.
        </p>
      </div>
      <form
        action={async (fd) => {
          const r = await createBlogPostLink(fd)
          if (r.error) window.alert(r.error)
        }}
        className="flex flex-wrap gap-3 items-end p-3 rounded-xl border border-deep-teal/20 bg-white"
      >
        <input type="hidden" name="blog_post_id" value={blogPostId} />
        <div>
          <Label className="sr-only">Type</Label>
          <select
            name="link_type"
            className="rounded-xl border border-input bg-background h-10 px-3 text-sm min-w-[100px]"
            required
          >
            {LINK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="sr-only">Label</Label>
          <Input name="title" placeholder="Link label" className="rounded-xl w-40" required />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="sr-only">URL</Label>
          <Input
            name="url"
            placeholder="/teachers/... or https://..."
            className="rounded-xl"
            required
          />
        </div>
        <Button type="submit" size="sm" className="rounded-xl">Add link</Button>
      </form>
      <ul className="space-y-2">
        {links.map((link) => (
          <li
            key={link.id}
            className="flex items-center gap-2 rounded-lg border p-3 flex-wrap bg-white"
          >
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-deep-teal/10 text-deep-teal capitalize">
              {link.link_type}
            </span>
            <span className="font-medium text-deep-teal">{link.title}</span>
            <span className="text-sm text-slate-500 truncate max-w-[200px]">{link.url}</span>
            <div className="flex rounded-xl overflow-hidden border border-deep-teal/20 ml-auto">
              <form action={reorderBlogPostLink} className="inline">
                <input type="hidden" name="linkId" value={link.id} />
                <input type="hidden" name="direction" value="up" />
                <Button type="submit" size="sm" variant="ghost" className="rounded-none h-8 px-2" title="Move up" aria-label="Move up">
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </form>
              <form action={reorderBlogPostLink} className="inline">
                <input type="hidden" name="linkId" value={link.id} />
                <input type="hidden" name="direction" value="down" />
                <Button type="submit" size="sm" variant="ghost" className="rounded-none h-8 px-2 border-l border-deep-teal/20" title="Move down" aria-label="Move down">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </form>
            </div>
            <form action={async () => await deleteBlogPostLink(link.id)} className="inline">
              <Button type="submit" size="sm" variant="outline" className="rounded-xl text-error-red border-error-red/50">
                Remove
              </Button>
            </form>
          </li>
        ))}
      </ul>
      {links.length === 0 && (
        <p className="text-sm text-slate-500">No links yet. Add one above.</p>
      )}
    </div>
  )
}
