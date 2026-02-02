"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface PublishLessonButtonProps {
  lessonId: string
  isPublished: boolean
  /** When set (Bunny CDN URL), publish is disabled until video is done encoding */
  videoUrl?: string | null
}

const POLL_INTERVAL_MS = 5000
const isBunnyUrl = (url: string) => url?.includes("b-cdn.net") ?? false

export function PublishLessonButton({ lessonId, isPublished, videoUrl }: PublishLessonButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [videoReady, setVideoReady] = useState<boolean | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Poll Bunny video status when lesson has a Bunny video and is not published
  useEffect(() => {
    if (isPublished || !videoUrl || !isBunnyUrl(videoUrl)) {
      setVideoReady(true)
      return
    }
    setVideoReady(null)

    const check = async () => {
      try {
        const res = await fetch(`/api/video/status?videoUrl=${encodeURIComponent(videoUrl)}`)
        const data = await res.json().catch(() => ({}))
        if (data.ready === true) {
          setVideoReady(true)
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
        } else {
          setVideoReady(false)
        }
      } catch {
        setVideoReady(false)
      }
    }

    check()
    pollRef.current = setInterval(check, POLL_INTERVAL_MS)
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [videoUrl, isPublished])

  const handleToggle = async () => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("lessons")
        .update({ is_published: !isPublished })
        .eq("id", lessonId)

      if (error) {
        alert(`Failed to ${isPublished ? "unpublish" : "publish"} lesson: ${error.message}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const hasBunnyVideo = Boolean(videoUrl && isBunnyUrl(videoUrl))
  const isProcessing = hasBunnyVideo && videoReady !== true
  const canPublish = !hasBunnyVideo || videoReady === true
  const disabled = isUpdating || (!isPublished && !canPublish)

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={disabled}
      className={isPublished ? "text-success-green border-success-green" : ""}
    >
      {isUpdating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing…
        </>
      ) : isPublished ? (
        <>
          <EyeOff className="h-4 w-4 mr-2" />
          Unpublish
        </>
      ) : (
        <>
          <Eye className="h-4 w-4 mr-2" />
          Publish
        </>
      )}
    </Button>
  )
}
