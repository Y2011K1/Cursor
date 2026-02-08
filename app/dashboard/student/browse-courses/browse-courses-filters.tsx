"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "rating", label: "Highest rated" },
  { value: "popular", label: "Most popular" },
  { value: "name", label: "A-Z" },
]

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
]

export function BrowseCoursesFilters({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const router = useRouter()
  const current = useSearchParams()

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(current?.toString() || "")
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`/dashboard/student/browse-courses?${next.toString()}`)
  }

  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "newest"
  const featured = searchParams.featured === "true"
  const certification = searchParams.certification === "true"
  const difficulty = typeof searchParams.difficulty === "string" ? searchParams.difficulty : ""

  return (
    <Card className="border-0 shadow-md sticky top-24">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-medium">Sort by</Label>
          <select
            value={sort}
            onChange={(e) => update("sort", e.target.value)}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-sm font-medium">Difficulty</Label>
          <select
            value={difficulty}
            onChange={(e) => update("difficulty", e.target.value || null)}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {DIFFICULTY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => update("featured", e.target.checked ? "true" : null)}
              className="rounded border-input"
            />
            <span className="text-sm">Featured only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={certification}
              onChange={(e) => update("certification", e.target.checked ? "true" : null)}
              className="rounded border-input"
            />
            <span className="text-sm">Certification available</span>
          </label>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/dashboard/student/browse-courses")}
        >
          Clear filters
        </Button>
      </CardContent>
    </Card>
  )
}
