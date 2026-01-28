"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const courseSchema = z.object({
  title: z.string().min(2, "Course title must be at least 2 characters"),
  description: z.string().optional(),
})

type CourseFormData = z.infer<typeof courseSchema>

interface CreateCourseDialogProps {
  classroomId: string
}

export function CreateCourseDialog({ classroomId }: CreateCourseDialogProps) {
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
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  })

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Check if a course already exists for this classroom
      const { data: existingCourses, error: checkError } = await supabase
        .from("courses")
        .select("id")
        .eq("classroom_id", classroomId)
        .limit(1)

      if (checkError) {
        setError(checkError.message)
        setIsSubmitting(false)
        return
      }

      if (existingCourses && existingCourses.length > 0) {
        setError("Each classroom can only have one course. Please edit the existing course instead.")
        setIsSubmitting(false)
        return
      }

      // Create the course (this should only happen once per classroom)
      const { error: insertError } = await supabase
        .from("courses")
        .insert({
          classroom_id: classroomId,
          title: data.title,
          description: data.description || null,
          order_index: 0,
          is_published: false,
        })

      if (insertError) {
        // Check if error is due to unique constraint
        if (insertError.message.includes("one_course_per_classroom") || insertError.code === "23505") {
          setError("Each classroom can only have one course. Please edit the existing course instead.")
        } else {
          setError(insertError.message)
        }
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
        <Button className="bg-deep-teal hover:bg-deep-teal/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Create New Course</DialogTitle>
          <DialogDescription>
            Create the course for your classroom. Each classroom can only have one course.
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
              Course created successfully!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Course Title *</Label>
            <Input
              id="title"
              placeholder="Introduction to Mathematics"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-warm-coral">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="A comprehensive introduction to mathematical concepts"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-warm-coral">{errors.description.message}</p>
            )}
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
                "Create Course"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
