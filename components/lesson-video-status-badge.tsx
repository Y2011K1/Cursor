"use client"

import { useState, useEffect } from "react"

interface LessonVideoStatusBadgeProps {
  videoUrl: string | null
}

const isBunnyUrl = (url: string) => url?.includes("b-cdn.net") ?? false
const POLL_MS = 5000

export function LessonVideoStatusBadge({ videoUrl }: LessonVideoStatusBadgeProps) {
  const [ready, setReady] = useState<boolean | null>(null)

  useEffect(() => {
    if (!videoUrl || !isBunnyUrl(videoUrl)) {
      setReady(true)
      return
    }
    setReady(null)
    const check = async () => {
      try {
        const res = await fetch(`/api/video/status?videoUrl=${encodeURIComponent(videoUrl)}`)
        const data = await res.json().catch(() => ({}))
        setReady(data.ready === true)
      } catch {
        setReady(false)
      }
    }
    check()
    const id = setInterval(check, POLL_MS)
    return () => clearInterval(id)
  }, [videoUrl])

  if (!videoUrl || !isBunnyUrl(videoUrl)) return null
  if (ready === true) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      Video processing
    </span>
  )
}
