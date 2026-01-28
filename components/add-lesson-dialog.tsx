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
import { Plus, Loader2, Upload, Video, Link as LinkIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { uploadVideo } from "@/app/actions/video"

const lessonSchema = z.object({
  title: z.string().min(2, "Lesson title must be at least 2 characters"),
  content: z.string().optional(),
  video_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  video_provider: z.enum(["bunny.net", "youtube", "vimeo", "other"]).optional(),
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
  const [uploadMethod, setUploadMethod] = useState<"url" | "upload">("url")
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
    watch,
    setValue,
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
  })

  const videoUrl = watch("video_url")

  // Auto-detect video provider from URL
  const detectVideoProvider = (url: string): "bunny.net" | "youtube" | "vimeo" | "other" | undefined => {
    if (!url) return undefined
    if (url.includes("bunny.net") || url.includes("b-cdn.net")) return "bunny.net"
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
    if (url.includes("vimeo.com")) return "vimeo"
    return "other"
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("video/")) {
        setError("Please select a video file")
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
    if (!selectedVideoFile) {
      setError("Please select a video file")
      return null
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("video", selectedVideoFile)
      formData.append("title", title)

      // Simulate progress (in real implementation, you'd track actual upload progress)
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
      return result.videoUrl
    } catch (err: any) {
      setError(err.message || "Failed to upload video")
      setIsUploading(false)
      return null
    }
  }

  const onSubmit = async (data: LessonFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      let finalVideoUrl = data.video_url || null
      let videoProvider: "bunny.net" | "youtube" | "vimeo" | "other" | null = null

      // If uploading a file, upload it first
      if (uploadMethod === "upload" && selectedVideoFile) {
        finalVideoUrl = await handleVideoUpload(data.title)
        if (!finalVideoUrl) {
          setIsSubmitting(false)
          return
        }
        videoProvider = "bunny.net"
      } else if (data.video_url) {
        videoProvider = detectVideoProvider(data.video_url)
      }

      // Get current max order_index for this classroom
      const { data: lessons } = await supabase
        .from("lessons")
        .select("order_index")
        .eq("classroom_id", classroomId)
        .order("order_index", { ascending: false })
        .limit(1)

      const nextOrderIndex = lessons && lessons.length > 0
        ? (lessons[0].order_index || 0) + 1
        : 0

      const { error: insertError } = await supabase
        .from("lessons")
        .insert({
          classroom_id: classroomId,
          title: data.title,
          content: data.content || null,
          video_url: finalVideoUrl,
          video_provider: videoProvider,
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
      setUploadMethod("url")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
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
          Add Lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Add New Lesson</DialogTitle>
          <DialogDescription>
            Create a new lesson for this course
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
              Lesson created successfully!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title *</Label>
            <Input
              id="title"
              placeholder="Introduction to Algebra"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-warm-coral">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content (Optional)</Label>
            <Textarea
              id="content"
              rows={6}
              placeholder="Lesson content, notes, or instructions..."
              {...register("content")}
            />
            {errors.content && (
              <p className="text-sm text-warm-coral">{errors.content.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label>Video (Optional)</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={uploadMethod === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadMethod("url")}
                  className="flex-1"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Use URL
                </Button>
                <Button
                  type="button"
                  variant={uploadMethod === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadMethod("upload")}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </Button>
              </div>
            </div>

            {uploadMethod === "url" ? (
              <div className="space-y-2">
                <Input
                  id="video_url"
                  type="url"
                  placeholder="https://vz-xxx.b-cdn.net/video.mp4 or YouTube/Vimeo URL"
                  {...register("video_url")}
                />
                {errors.video_url && (
                  <p className="text-sm text-warm-coral">{errors.video_url.message}</p>
                )}
                {videoUrl && (
                  <p className="text-xs text-slate-blue">
                    Provider: {detectVideoProvider(videoUrl) || "Unknown"}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border-2 border-dashed border-slate-blue/30 rounded-lg p-6 text-center">
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
                    <span className="text-xs text-slate-blue/70">
                      Max size: 500MB
                    </span>
                  </label>
                </div>
                {selectedVideoFile && (
                  <div className="text-xs text-slate-blue">
                    Selected: {selectedVideoFile.name} ({(selectedVideoFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="w-full bg-slate-blue/20 rounded-full h-2">
                      <div
                        className="bg-deep-teal h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-blue text-center">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
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
                setSelectedVideoFile(null)
                setUploadMethod("url")
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
              }}
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
                  {isUploading ? "Uploading..." : "Creating..."}
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
