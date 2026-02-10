"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTestimonialAsStudent } from "@/app/actions/testimonial"
import { Loader2 } from "lucide-react"

interface LeaveTestimonialFormProps {
  /** Called after successful submit (e.g. to close a dialog) */
  onSuccess?: () => void
  /** Optional default course name for the "Course or role" field */
  defaultCourse?: string | null
}

export function LeaveTestimonialForm({ onSuccess, defaultCourse }: LeaveTestimonialFormProps) {
  const [message, setMessage] = useState<"success" | "error" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <form
      action={async (fd) => {
        if (isSubmitting) return
        setIsSubmitting(true)
        setMessage(null)
        try {
          const r = await createTestimonialAsStudent(fd)
          if (r.error) {
            setMessage("error")
          } else {
            setMessage("success")
            onSuccess?.()
          }
        } finally {
          setIsSubmitting(false)
        }
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
        <Input id="student_role_or_course" name="student_role_or_course" placeholder="e.g. Web Development" defaultValue={defaultCourse ?? ""} className="mt-1" />
      </div>
      {message === "success" && <p className="text-sm text-success-green">Thank you! Your testimonial was submitted and may be published after review.</p>}
      {message === "error" && <p className="text-sm text-error-red">Something went wrong. Please try again.</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : "Submit testimonial"}
      </Button>
    </form>
  )
}
