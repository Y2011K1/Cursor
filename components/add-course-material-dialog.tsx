"use client"

import { useState, useRef } from "react"
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
import { Plus, Loader2, Upload, File } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const materialSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  file_url: z.string().url("Please enter a valid URL").min(1, "File URL is required"),
})

type MaterialFormData = z.infer<typeof materialSchema>

interface AddCourseMaterialDialogProps {
  classroomId: string
}

export function AddCourseMaterialDialog({ classroomId }: AddCourseMaterialDialogProps) {
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
    watch,
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
  })

  const fileUrl = watch("file_url")

  // Extract file name from URL
  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const fileName = pathname.split('/').pop() || 'document'
      return decodeURIComponent(fileName)
    } catch {
      return 'document'
    }
  }

  // Detect file type from URL
  const getFileType = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase() || ''
    if (['pdf'].includes(extension)) return 'PDF'
    if (['doc', 'docx'].includes(extension)) return 'Word'
    if (['xls', 'xlsx'].includes(extension)) return 'Excel'
    if (['ppt', 'pptx'].includes(extension)) return 'PowerPoint'
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'Image'
    return 'Document'
  }

  const onSubmit = async (data: MaterialFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Get current max order_index for this classroom
      const { data: materials } = await supabase
        .from("course_materials")
        .select("order_index")
        .eq("classroom_id", classroomId)
        .order("order_index", { ascending: false })
        .limit(1)

      const nextOrderIndex = materials && materials.length > 0
        ? (materials[0].order_index || 0) + 1
        : 0

      const fileName = getFileNameFromUrl(data.file_url)
      const fileType = getFileType(data.file_url)

      const { error: insertError } = await supabase
        .from("course_materials")
        .insert({
          classroom_id: classroomId,
          title: data.title,
          description: data.description || null,
          file_url: data.file_url,
          file_name: fileName,
          file_type: fileType,
          order_index: nextOrderIndex,
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
        <Button size="sm" className="bg-deep-teal hover:bg-deep-teal/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Add Course Material</DialogTitle>
          <DialogDescription>
            Add a document, PDF, or other file for students to download
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
              Course material added successfully!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Material Title *</Label>
            <Input
              id="title"
              placeholder="Chapter 1 Notes"
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
              placeholder="Brief description of the material"
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file_url">File URL *</Label>
            <Input
              id="file_url"
              type="url"
              placeholder="https://example.com/file.pdf"
              {...register("file_url")}
            />
            {errors.file_url && (
              <p className="text-sm text-warm-coral">{errors.file_url.message}</p>
            )}
            {fileUrl && (
              <p className="text-xs text-slate-blue">
                File: {getFileNameFromUrl(fileUrl)} ({getFileType(fileUrl)})
              </p>
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
                  Adding...
                </>
              ) : (
                "Add Material"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
