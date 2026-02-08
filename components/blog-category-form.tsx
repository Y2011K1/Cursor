"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createCategory } from "@/app/dashboard/admin/blog/actions"

export function BlogCategoryForm() {
  const [state, formAction] = useActionState(
    async (_: unknown, fd: FormData) => {
      const result = await createCategory(fd)
      if (result.error) return { error: result.error }
      return { error: null, success: true }
    },
    null as { error: string } | null
  )

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2">Category added.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label htmlFor="cat_name" className="text-xs">Name</Label>
          <Input id="cat_name" name="name" required className="mt-0.5 h-9 rounded-lg" placeholder="e.g. News" />
        </div>
        <div>
          <Label htmlFor="cat_slug" className="text-xs">Slug</Label>
          <Input id="cat_slug" name="slug" required className="mt-0.5 h-9 rounded-lg" placeholder="news" />
        </div>
      </div>
      <div>
        <Label htmlFor="cat_description" className="text-xs">Description (optional)</Label>
        <Textarea id="cat_description" name="description" rows={1} className="mt-0.5 rounded-lg" placeholder="Optional" />
      </div>
      <Button type="submit" size="sm" className="rounded-lg">Add category</Button>
    </form>
  )
}
