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

const examSchema = z.object({
  title: z.string().min(2, "Exam title must be at least 2 characters"),
  description: z.string().optional(),
  time_limit_minutes: z.string().refine((val) => {
    const num = parseInt(val)
    return !isNaN(num) && num > 0 && num <= 480
  }, "Time limit must be between 1 and 480 minutes"),
  due_date: z.string().optional(),
})

type ExamFormData = z.infer<typeof examSchema>

interface AddExamDialogProps {
  classroomId: string
}

export function AddExamDialog({ classroomId }: AddExamDialogProps) {
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
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
  })

  const onSubmit = async (data: ExamFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: insertError } = await supabase
        .from("exams")
        .insert({
          classroom_id: classroomId,
          title: data.title,
          description: data.description || null,
          time_limit_minutes: parseInt(data.time_limit_minutes),
          due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
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
          Add Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Create New Exam</DialogTitle>
          <DialogDescription>
            Create an exam for this course. Students can only take it once.
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
              Exam created successfully!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Exam Title *</Label>
            <Input
              id="title"
              placeholder="Midterm Exam"
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
              placeholder="Exam instructions or description"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-warm-coral">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time_limit_minutes">Time Limit (minutes) *</Label>
            <Input
              id="time_limit_minutes"
              type="number"
              placeholder="60"
              {...register("time_limit_minutes")}
            />
            {errors.time_limit_minutes && (
              <p className="text-sm text-warm-coral">{errors.time_limit_minutes.message}</p>
            )}
            <p className="text-xs text-slate-blue">
              Maximum time allowed for the exam (1-480 minutes)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date (Optional)</Label>
            <Input
              id="due_date"
              type="datetime-local"
              {...register("due_date")}
            />
            {errors.due_date && (
              <p className="text-sm text-warm-coral">{errors.due_date.message}</p>
            )}
            <p className="text-xs text-slate-blue">
              Set a deadline for when students must complete this exam
            </p>
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
                "Create Exam"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
