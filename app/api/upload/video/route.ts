import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createBunnyVideo, uploadVideoToBunny } from "@/lib/bunny"

export const runtime = "nodejs"

// Allow large request body for video upload (no default 1MB limit on Route Handlers)
export const dynamic = "force-dynamic"

const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500MB

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to upload." }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "Only teachers can upload videos." }, { status: 403 })
    }

    const formData = await request.formData()
    const videoFile = formData.get("video")
    const title = formData.get("title")

    if (!videoFile || !(videoFile instanceof Blob)) {
      return NextResponse.json({ error: "No video file provided." }, { status: 400 })
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Video title is required." }, { status: 400 })
    }
    if (videoFile.size === 0) {
      return NextResponse.json(
        { error: "Video file is empty. Try a smaller file or check your connection." },
        { status: 400 }
      )
    }
    if (videoFile.size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ error: "Video is too large. Maximum size is 500MB." }, { status: 400 })
    }

    const videoData = await createBunnyVideo(title.trim())
    if (!videoData) {
      return NextResponse.json({ error: "Failed to create video in Bunny." }, { status: 500 })
    }

    const videoUrl = await uploadVideoToBunny(videoData.videoId, videoFile)
    return NextResponse.json({ success: true, videoUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
