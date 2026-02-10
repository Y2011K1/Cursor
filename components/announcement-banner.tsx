"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { X } from "lucide-react"

const DISMISS_KEY = "eduplatform_announcement_dismiss"
const DISMISS_HOURS = 24

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<{
    id: string
    title: string
    content: string
    type: string
    background_color: string
    text_color: string
  } | null>(null)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const dismissedUntil = typeof window !== "undefined" ? localStorage.getItem(DISMISS_KEY) : null
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return
    }
    setDismissed(false)

    const supabase = createClient()
    supabase
      .from("announcements")
      .select("id, title, content, type, background_color, text_color")
      .eq("is_active", true)
      .or("start_date.is.null,start_date.lte.now()")
      .or("end_date.is.null,end_date.gte.now()")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setAnnouncement(data)
      })
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== "undefined") {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + DISMISS_HOURS * 60 * 60 * 1000)
      )
    }
  }

  if (!announcement || dismissed) return null

  return (
    <div
      className="relative flex items-center justify-start gap-4 px-4 py-2 text-sm text-left"
      style={{
        backgroundColor: announcement.background_color || "#3b82f6",
        color: announcement.text_color || "#ffffff",
      }}
    >
      <span className="font-semibold shrink-0">{announcement.title}</span>
      <span className="hidden sm:inline shrink-0">—</span>
      <span className="flex-1 min-w-0">{announcement.content}</span>
      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 rounded hover:bg-white/20 focus:outline-none"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
