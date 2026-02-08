"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const quizSchema = z.object({
  title: z.string().min(2, "Quiz title must be at least 2 characters"),
  description: z.string().optional(),
  time_limit_minutes: z.string().optional().refine((val) => {
    if (!val) return true
    const num = parseInt(val)
    return !isNaN(num) && num > 0
  }, "Time limit must be a positive number"),
  max_attempts: z.string().refine((val) => {
    const num = parseInt(val)
    return !isNaN(num) && num > 0 && num <= 10
  }, "Max attempts must be between 1 and 10"),
})

type QuizFormData = z.infer<typeof quizSchema>

interface AddQuizDialogProps {
  classroomId: string
}

export function AddQuizDialog({ classroomId }: AddQuizDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      max_attempts: "1",
    },
  })

  const onSubmit = async (data: QuizFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: insertError } = await supabase
        .from("quizzes")
        .insert({
          course_id: classroomId,
          title: data.title,
          description: data.description || null,
          time_limit_minutes: data.time_limit_minutes ? parseInt(data.time_limit_minutes) : null,
          max_attempts: parseInt(data.max_attempts),
          is_published: false,
        })

      if (insertError) {
        setError(insertError.message)
        setIsSubmitting(false)
        return
      }

      setSuccess(true)
      reset()
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-soft-mint hover:bg-soft-mint/80 text-dark-text">
          <Plus className="h-4 w-4 mr-2" />
          Add Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Create New Quiz</DialogTitle>
          <DialogDescription>
            Create a quiz (assignment) for this course
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-md bg-success-green/20 border border-success-green text-success-green text-sm">
              Quiz created successfully!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Quiz Title *</Label>
            <Input
              id="title"
              placeholder="Chapter 1 Quiz"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-warm-coral">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Quiz instructions or description"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-warm-coral">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time_limit_minutes">Time Limit (minutes, optional)</Label>
              <Input
                id="time_limit_minutes"
                type="number"
                min="1"
                placeholder="30"
                {...register("time_limit_minutes")}
              />
              {errors.time_limit_minutes && (
                <p className="text-sm text-warm-coral">{errors.time_limit_minutes.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_attempts">Max Attempts *</Label>
              <Input
                id="max_attempts"
                type="number"
                min="1"
                max="10"
                placeholder="1"
                {...register("max_attempts")}
              />
              {errors.max_attempts && (
                <p className="text-sm text-warm-coral">{errors.max_attempts.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                reset()
                setError(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-deep-teal hover:bg-deep-teal/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Quiz"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
