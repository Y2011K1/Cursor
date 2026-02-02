"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  videoUrl: string | null
  videoProvider: string | null
  lessonId: string
  studentId: string
}

const isBunnyUrl = (url: string) => url?.includes("b-cdn.net") ?? false

/** Parse Bunny CDN URL to get library ID and video ID for embed. e.g. https://vz-12345.b-cdn.net/guid-here/play_480p.mp4 */
function getBunnyEmbedParams(videoUrl: string): { libraryId: string; videoId: string } | null {
  try {
    const u = new URL(videoUrl)
    const host = u.hostname
    const pathParts = u.pathname.split("/").filter(Boolean)
    const match = host.match(/^vz-(\d+)\.b-cdn\.net$/i)
    if (!match || pathParts.length < 1) return null
    const libraryId = match[1]
    const videoId = pathParts[0]
    if (!libraryId || !videoId || videoId.length < 5) return null
    return { libraryId, videoId }
  } catch {
    return null
  }
}

export function VideoPlayer({ videoUrl, videoProvider, lessonId, studentId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastUpdateTime = useRef<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const now = Date.now()
      if (now - lastUpdateTime.current < 1000) return
      lastUpdateTime.current = now
      if (video.readyState >= 2 && video.duration > 0 && video.currentTime > 0) {
        try {
          const supabase = createClient()
          // Update lesson progress (implement when needed)
        } catch (err) {
          console.error("Error updating video progress:", err)
        }
      }
    }

    const handleError = () => {
      setError("This video could not be loaded. Please try again later.")
    }

    const handleLoadStart = () => setError(null)
    const handleCanPlay = () => setError(null)

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("error", handleError)
    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("canplay", handleCanPlay)
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("error", handleError)
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [lessonId, studentId, videoUrl, retryKey])

  if (!videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-blue">
        <p>No video URL provided</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-200 text-warm-coral p-4">
        <p className="text-center text-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null)
            setRetryKey((k) => k + 1)
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  if (videoProvider === "youtube") {
    const youtubeId = videoUrl.includes("embed")
      ? videoUrl.split("embed/")[1]?.split("?")[0]
      : videoUrl.split("v=")[1]?.split("&")[0] || videoUrl.split("youtu.be/")[1]?.split("?")[0]
    if (!youtubeId) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-warm-coral">
          <p>Invalid YouTube URL</p>
        </div>
      )
    }
    return (
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  if (videoProvider === "vimeo") {
    const vimeoId = videoUrl.includes("player")
      ? videoUrl.split("video/")[1]?.split("?")[0]
      : videoUrl.split("vimeo.com/")[1]?.split("?")[0]
    if (!vimeoId) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-warm-coral">
          <p>Invalid Vimeo URL</p>
        </div>
      )
    }
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}`}
        className="w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    )
  }

  if ((videoProvider === "bunny.net" || !videoProvider) && isBunnyUrl(videoUrl)) {
    const embed = getBunnyEmbedParams(videoUrl)
    if (embed) {
      const embedSrc = `https://iframe.mediadelivery.net/embed/${embed.libraryId}/${embed.videoId}?autoplay=false&preload=true`
      return (
        <iframe
          key={retryKey}
          src={embedSrc}
          className="w-full h-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )
    }
  }

  const videoSrc = videoUrl.startsWith("http") ? videoUrl : `https://${videoUrl}`
  return (
    <video
      key={retryKey}
      ref={videoRef}
      src={videoSrc}
      controls
      className="w-full h-full"
      preload="metadata"
      playsInline
    />
  )
}
