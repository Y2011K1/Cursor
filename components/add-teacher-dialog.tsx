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
import { createTeacher } from "@/app/actions/admin"

const teacherSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  classroomName: z.string().min(2, "Classroom name must be at least 2 characters"),
  classroomSubject: z.string().min(2, "Subject must be at least 2 characters"),
  classroomDescription: z.string().optional(),
  maxStudents: z.string().refine((val) => {
    const num = parseInt(val)
    return !isNaN(num) && num > 0 && num <= 50
  }, "Max students must be between 1 and 50"),
})

type TeacherFormData = z.infer<typeof teacherSchema>

export function AddTeacherDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      maxStudents: "10",
    },
  })

  const onSubmit = async (data: TeacherFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append("email", data.email)
      formData.append("password", data.password)
      formData.append("fullName", data.fullName)
      formData.append("classroomName", data.classroomName)
      formData.append("classroomSubject", data.classroomSubject)
      formData.append("classroomDescription", data.classroomDescription || "")
      formData.append("maxStudents", data.maxStudents)

      const result = await createTeacher(formData)

      if (result.success) {
        setSuccess(true)
        reset()
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
          router.refresh()
        }, 1500)
      } else {
        setError(result.error || "Failed to create teacher")
      }
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
          Add Teacher
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Add New Teacher</DialogTitle>
          <DialogDescription>
            Create a teacher account with email and password. The teacher can log in immediately.
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
              Teacher created successfully! Redirecting...
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Teacher Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-sm text-warm-coral">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="teacher@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-warm-coral">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-warm-coral">{errors.password.message}</p>
            )}
            <p className="text-xs text-slate-blue">
              Set the initial password for this teacher
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="classroomName">Classroom Name</Label>
            <Input
              id="classroomName"
              placeholder="Mathematics 101"
              {...register("classroomName")}
            />
            {errors.classroomName && (
              <p className="text-sm text-warm-coral">{errors.classroomName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="classroomSubject">Subject *</Label>
            <Input
              id="classroomSubject"
              placeholder="Mathematics"
              {...register("classroomSubject")}
            />
            {errors.classroomSubject && (
              <p className="text-sm text-warm-coral">{errors.classroomSubject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="classroomDescription">Classroom Description (Optional)</Label>
            <Input
              id="classroomDescription"
              placeholder="Introduction to Mathematics"
              {...register("classroomDescription")}
            />
            {errors.classroomDescription && (
              <p className="text-sm text-warm-coral">{errors.classroomDescription.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxStudents">Max Students</Label>
            <Input
              id="maxStudents"
              type="number"
              min="1"
              max="50"
              placeholder="10"
              {...register("maxStudents")}
            />
            {errors.maxStudents && (
              <p className="text-sm text-warm-coral">{errors.maxStudents.message}</p>
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
                "Create Teacher"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
