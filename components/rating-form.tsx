"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface RatingFormProps {
  courseId: string
  studentId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CourseRatingForm({ courseId, studentId, onSuccess, onCancel }: RatingFormProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError("Please select a rating")
      return
    }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from("course_ratings").upsert(
      {
        course_id: courseId,
        student_id: studentId,
        rating,
        content_quality: rating,
        difficulty_accuracy: rating,
        usefulness: rating,
        written_feedback: feedback || null,
        is_approved: false,
      },
      { onConflict: "course_id,student_id" }
    )
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Your rating</Label>
        <div className="flex gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-deep-teal"
              aria-label={`${value} stars`}
            >
              <Star
                className={`h-8 w-8 ${
                  value <= (hover || rating)
                    ? "fill-warning-yellow text-warning-yellow"
                    : "text-slate-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="feedback">Feedback (optional)</Label>
        <Textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your experience..."
          className="mt-2 min-h-[100px]"
        />
      </div>
      {error && <p className="text-sm text-warm-coral">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit rating"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
