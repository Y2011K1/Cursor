"use server"

import { createBunnyVideo, uploadVideoToBunny } from "@/lib/bunny"
import { requireRole } from "@/lib/auth"

export async function uploadVideo(formData: FormData) {
  // Verify teacher role
  await requireRole("teacher")

  const videoFile = formData.get("video") as File
  const title = formData.get("title") as string

  if (!videoFile || !(videoFile instanceof Blob)) {
    return {
      success: false,
      error: "No video file provided",
    }
  }

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return {
      success: false,
      error: "Video title is required",
    }
  }

  // Detect truncated upload (e.g. body size limit exceeded)
  if (videoFile.size === 0) {
    return {
      success: false,
      error: "Video file is empty or upload was truncated. Ensure server allows large uploads (e.g. 500MB) and try a smaller file.",
    }
  }

  // Validate file type (allow empty type from some clients)
  const type = (videoFile as File).type ?? ""
  if (type && !type.startsWith("video/")) {
    return {
      success: false,
      error: "File must be a video (e.g. MP4, WebM)",
    }
  }

  // Validate file size (max 500MB)
  const maxSize = 500 * 1024 * 1024 // 500MB
  if (videoFile.size > maxSize) {
    return {
      success: false,
      error: "Video file is too large. Maximum size is 500MB",
    }
  }

  try {
    // Step 1: Create video object in Bunny Stream (uses API route for large files; action kept for compatibility)
    const videoData = await createBunnyVideo(title)
    if (!videoData) {
      return {
        success: false,
        error: "Failed to create video object",
      }
    }

    // Step 2: Upload video file
    const videoUrl = await uploadVideoToBunny(videoData.videoId, videoFile)

    return {
      success: true,
      videoId: videoData.videoId,
      videoUrl,
      message: "Video uploaded successfully",
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to upload video",
    }
  }
}
