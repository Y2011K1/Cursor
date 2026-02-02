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
import { Plus, Loader2, Upload, Video } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { uploadVideo } from "@/app/actions/video"

const lessonSchema = z.object({
  title: z.string().min(2, "Lesson title must be at least 2 characters"),
  content: z.string().optional(),
})

type LessonFormData = z.infer<typeof lessonSchema>

interface AddLessonDialogProps {
  classroomId: string
}

export function AddLessonDialog({ classroomId }: AddLessonDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("video/")) {
        setError("Please select a video file (e.g. MP4, WebM)")
        return
      }
      if (file.size > 500 * 1024 * 1024) {
        setError("Video file is too large. Maximum size is 500MB")
        return
      }
      setSelectedVideoFile(file)
      setError(null)
    }
  }

  const handleVideoUpload = async (title: string) => {
    if (!selectedVideoFile) return null

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("video", selectedVideoFile)
      formData.append("title", title)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const result = await uploadVideo(formData)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!result.success) {
        setError(result.error || "Failed to upload video")
        setIsUploading(false)
        return null
      }

      setIsUploading(false)
      return result.videoUrl ?? null
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload video")
      setIsUploading(false)
      return null
    }
  }

  const onSubmit = async (data: LessonFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      let finalVideoUrl: string | null = null

      if (selectedVideoFile) {
        finalVideoUrl = await handleVideoUpload(data.title) ?? null
        if (!finalVideoUrl) {
          setIsSubmitting(false)
          return
        }
      }

      const { data: lessons } = await supabase
        .from("lessons")
        .select("order_index")
        .eq("classroom_id", classroomId)
        .order("order_index", { ascending: false })
        .limit(1)

      const nextOrderIndex = lessons && lessons.length > 0
        ? (lessons[0].order_index ?? 0) + 1
        : 0

      const { error: insertError } = await supabase
        .from("lessons")
        .insert({
          classroom_id: classroomId,
          title: data.title,
          content: data.content || null,
          video_url: finalVideoUrl,
          video_provider: finalVideoUrl ? "bunny.net" : null,
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
      setSelectedVideoFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        router.refresh()
      }, 1000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset()
      setError(null)
      setSelectedVideoFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
    setOpen(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-deep-teal hover:bg-deep-teal/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Add New Lesson</DialogTitle>
          <DialogDescription>
            Add a lesson with optional video (upload only). Video is stored and streamed via Bunny.net.
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
              Lesson created successfully.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Introduction to Algebra"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-warm-coral">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content (optional)</Label>
            <Textarea
              id="content"
              rows={4}
              placeholder="Notes or instructions..."
              {...register("content")}
            />
          </div>

          <div className="space-y-2">
            <Label>Video (optional)</Label>
            <div className="border-2 border-dashed border-slate-blue/30 rounded-lg p-5 text-center bg-light-sky/50">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="video-file-input"
              />
              <label
                htmlFor="video-file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Video className="h-8 w-8 text-slate-blue" />
                <span className="text-sm text-slate-blue">
                  {selectedVideoFile
                    ? selectedVideoFile.name
                    : "Click to select video file"}
                </span>
                <span className="text-xs text-slate-blue/70">Max 500MB (MP4, WebM, etc.)</span>
              </label>
            </div>
            {selectedVideoFile && (
              <p className="text-xs text-slate-blue">
                Selected: {selectedVideoFile.name} ({(selectedVideoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-slate-blue/20 rounded-full h-2">
                  <div
                    className="bg-deep-teal h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-blue text-center">Uploading… {uploadProgress}%</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-deep-teal hover:bg-deep-teal/90"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? "Uploading…" : "Creating…"}
                </>
              ) : (
                "Create Lesson"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
