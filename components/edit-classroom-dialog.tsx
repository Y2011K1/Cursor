"use client"

import { useState, useEffect } from "react"
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
import { Edit, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const classroomSchema = z.object({
  name: z.string().min(2, "Classroom name must be at least 2 characters"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  max_students: z.string().refine((val) => {
    const num = parseInt(val)
    return !isNaN(num) && num > 0 && num <= 1000
  }, "Max students must be between 1 and 1000"),
})

type ClassroomFormData = z.infer<typeof classroomSchema>

interface EditClassroomDialogProps {
  classroomId: string
  currentData: {
    name: string
    description?: string | null
    subject?: string | null
    max_students: number
  }
}

export function EditClassroomDialog({ classroomId, currentData }: EditClassroomDialogProps) {
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
  } = useForm<ClassroomFormData>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      name: currentData.name,
      description: currentData.description || "",
      subject: currentData.subject || "",
      max_students: currentData.max_students.toString(),
    },
  })

  // Reset form when dialog opens with current data
  useEffect(() => {
    if (open) {
      reset({
        name: currentData.name,
        description: currentData.description || "",
        subject: currentData.subject || "",
        max_students: currentData.max_students.toString(),
      })
    }
  }, [open, currentData, reset])

  const onSubmit = async (data: ClassroomFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from("courses")
        .update({
          name: data.name,
          description: data.description || null,
          subject: data.subject,
          max_students: parseInt(data.max_students),
        })
        .eq("id", classroomId)

      if (updateError) {
        setError(updateError.message)
        setIsSubmitting(false)
        return
      }

      setSuccess(true)
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
        <Button className="w-full" variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Classroom Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Edit Classroom</DialogTitle>
          <DialogDescription>
            Update your classroom information
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
              Classroom updated successfully!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Classroom Name *</Label>
            <Input
              id="name"
              placeholder="Mathematics 101"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-warm-coral">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Mathematics"
              {...register("subject")}
            />
            {errors.subject && (
              <p className="text-sm text-warm-coral">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Classroom description"
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_students">Max Students *</Label>
            <Input
              id="max_students"
              type="number"
              min="1"
              max="1000"
              placeholder="30"
              {...register("max_students")}
            />
            {errors.max_students && (
              <p className="text-sm text-warm-coral">{errors.max_students.message}</p>
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
                  Updating...
                </>
              ) : (
                "Update Classroom"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
