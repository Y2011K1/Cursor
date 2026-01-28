"use server"

import { createBunnyVideo, uploadVideoToBunny } from "@/lib/bunny"
import { requireRole } from "@/lib/auth"

export async function uploadVideo(formData: FormData) {
  // Verify teacher role
  await requireRole("teacher")

  const videoFile = formData.get("video") as File
  const title = formData.get("title") as string

  if (!videoFile) {
    return {
      success: false,
      error: "No video file provided",
    }
  }

  if (!title) {
    return {
      success: false,
      error: "Video title is required",
    }
  }

  // Validate file type
  if (!videoFile.type.startsWith("video/")) {
    return {
      success: false,
      error: "File must be a video",
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
    // Step 1: Create video object in Bunny Stream
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
