"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTestimonialAsStudent } from "@/app/actions/testimonial"

export function LeaveTestimonialForm() {
  const [message, setMessage] = useState<"success" | "error" | null>(null)

  return (
    <form
      action={async (fd) => {
        const r = await createTestimonialAsStudent(fd)
        setMessage(r.error ? "error" : "success")
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="quote">Your testimonial *</Label>
        <Textarea id="quote" name="quote" rows={4} required placeholder="Share your experience with the platform or a course..." className="mt-1" />
      </div>
      <div>
        <Label htmlFor="rating">Rating (1–5)</Label>
        <Input id="rating" name="rating" type="number" min={1} max={5} defaultValue={5} className="mt-1 w-20" />
      </div>
      <div>
        <Label htmlFor="student_role_or_course">Course or role (optional)</Label>
        <Input id="student_role_or_course" name="student_role_or_course" placeholder="e.g. Web Development" className="mt-1" />
      </div>
      {message === "success" && <p className="text-sm text-success-green">Thank you! Your testimonial was submitted and may be published after review.</p>}
      {message === "error" && <p className="text-sm text-error-red">Something went wrong. Please try again.</p>}
      <Button type="submit">Submit testimonial</Button>
    </form>
  )
}
