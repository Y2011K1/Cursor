"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface VideoPlayerProps {
  videoUrl: string | null
  videoProvider: string | null
  lessonId: string
  studentId: string
}

export function VideoPlayer({ videoUrl, videoProvider, lessonId, studentId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastUpdateTime = useRef<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = async () => {
      // Throttle updates to once per second
      const now = Date.now()
      if (now - lastUpdateTime.current < 1000) return
      lastUpdateTime.current = now

      if (video.readyState >= 2) {
        const watchTime = Math.floor(video.currentTime)
        const duration = Math.floor(video.duration)
        
        // Update progress in background
        if (duration > 0 && watchTime > 0) {
          try {
            const supabase = createClient()
            // Update lesson progress (we can implement this properly later)
            // For now, just track watch time
          } catch (error) {
            console.error("Error updating video progress:", error)
          }
        }
      }
    }

    const handleError = (e: Event) => {
      console.error("Video error:", e)
      const videoElement = e.target as HTMLVideoElement
      if (videoElement.error) {
        console.error("Video error code:", videoElement.error.code)
        console.error("Video error message:", videoElement.error.message)
      }
      setError("Failed to load video. Please check the video URL or try again later.")
    }

    const handleLoadStart = () => {
      setError(null) // Clear any previous errors when starting to load
    }

    const handleCanPlay = () => {
      setError(null) // Clear errors when video can play
    }

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
  }, [lessonId, studentId])

  // Handle missing video URL
  if (!videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-blue">
        <p>No video URL provided</p>
      </div>
    )
  }

  // Handle errors
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-warm-coral">
        <p>{error}</p>
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

  if (videoProvider === "bunny.net" || !videoProvider) {
    // For bunny.net, ensure the URL is properly formatted
    // Bunny.net URLs should be like: https://vz-{libraryId}.b-cdn.net/{videoId}/play_480p.mp4
    const videoSrc = videoUrl.startsWith("http") ? videoUrl : `https://${videoUrl}`
    
    return (
      <video
        ref={videoRef}
        src={videoSrc}
        controls
        className="w-full h-full"
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
      />
    )
  }

  // Default video player
  const videoSrc = videoUrl.startsWith("http") ? videoUrl : `https://${videoUrl}`
  
  return (
    <video
      ref={videoRef}
      src={videoSrc}
      controls
      className="w-full h-full"
      preload="metadata"
      crossOrigin="anonymous"
      playsInline
    />
  )
}
