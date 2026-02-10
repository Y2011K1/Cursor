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
import { Edit, Loader2, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const courseSchema = z.object({
  name: z.string().min(2, "Course name must be at least 2 characters"),
  description: z.string().optional(),
  thumbnail_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
})

type CourseFormData = z.infer<typeof courseSchema>

interface EditCourseDialogProps {
  courseId: string
  currentData: {
    name: string
    description?: string | null
    thumbnail_url?: string | null
  }
}

export function EditCourseDialog({ courseId, currentData }: EditCourseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(currentData.thumbnail_url || null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: currentData.name,
      description: currentData.description || "",
      thumbnail_url: currentData.thumbnail_url || "",
    },
  })

  const thumbnailUrl = watch("thumbnail_url")

  useEffect(() => {
    if (open) {
      reset({
        name: currentData.name,
        description: currentData.description || "",
        thumbnail_url: currentData.thumbnail_url || "",
      })
      setImagePreview(currentData.thumbnail_url || null)
    }
  }, [open, currentData, reset])

  useEffect(() => {
    setImagePreview(thumbnailUrl || null)
  }, [thumbnailUrl])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set("folder", "course-thumbnail")
      const res = await fetch("/api/upload/image", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to upload image")
        return
      }
      setValue("thumbnail_url", data.url)
      setImagePreview(data.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from("courses")
        .update({
          name: data.name,
          description: data.description || null,
          thumbnail_url: data.thumbnail_url || null,
        })
        .eq("id", courseId)

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
        <Button variant="outline" className="w-full">
          <Edit className="h-4 w-4 mr-2" />
          Edit Course Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Edit Course</DialogTitle>
          <DialogDescription>
            Update your course details and image
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
              Course updated successfully!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Course Name *</Label>
            <Input
              id="name"
              placeholder="Introduction to Mathematics"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A comprehensive introduction to mathematical concepts"
              rows={4}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">Course Image</Label>
            <div className="space-y-3">
              {imagePreview && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-deep-teal/20">
                  <img
                    src={imagePreview}
                    alt="Course preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setValue("thumbnail_url", "")
                      setImagePreview(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isUploading}
                    asChild
                  >
                    <span>
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
              <Input
                id="thumbnail_url"
                placeholder="Or enter image URL directly"
                {...register("thumbnail_url")}
              />
              {errors.thumbnail_url && (
                <p className="text-sm text-red-600">{errors.thumbnail_url.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setError(null)
                setSuccess(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
