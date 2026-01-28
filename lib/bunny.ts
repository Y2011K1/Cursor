/**
 * Bunny.net Video Streaming API Integration
 * Handles video uploads and management
 */

const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID
const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY
const BUNNY_CDN_URL = process.env.NEXT_PUBLIC_BUNNY_CDN_URL

if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
  console.warn("Bunny.net Stream API credentials not configured")
}

/**
 * Create a video object in Bunny Stream library
 */
export async function createBunnyVideo(title: string): Promise<{ videoId: string; videoLibraryId: number } | null> {
  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
    throw new Error("Bunny.net Stream API credentials not configured")
  }

  try {
    const response = await fetch(`https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos`, {
      method: "POST",
      headers: {
        "AccessKey": BUNNY_STREAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create video: ${error}`)
    }

    const data = await response.json()
    return {
      videoId: data.guid,
      videoLibraryId: data.videoLibraryId,
    }
  } catch (error: any) {
    console.error("Error creating Bunny video:", error)
    throw error
  }
}

/**
 * Upload video file to Bunny Stream
 */
export async function uploadVideoToBunny(
  videoId: string,
  videoFile: File | Blob
): Promise<string> {
  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
    throw new Error("Bunny.net Stream API credentials not configured")
  }

  try {
    const arrayBuffer = await videoFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`,
      {
        method: "PUT",
        headers: {
          "AccessKey": BUNNY_STREAM_API_KEY,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to upload video: ${error}`)
    }

    // Return the video URL
    // Bunny Stream videos are accessible via: https://vz-{libraryId}.b-cdn.net/{videoId}/play_480p.mp4
    const libraryId = BUNNY_STREAM_LIBRARY_ID
    return `https://vz-${libraryId}.b-cdn.net/${videoId}/play_480p.mp4`
  } catch (error: any) {
    console.error("Error uploading video to Bunny:", error)
    throw error
  }
}

/**
 * Get video status and details
 */
export async function getBunnyVideoStatus(videoId: string): Promise<any> {
  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
    throw new Error("Bunny.net Stream API credentials not configured")
  }

  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`,
      {
        method: "GET",
        headers: {
          "AccessKey": BUNNY_STREAM_API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to get video status")
    }

    return await response.json()
  } catch (error: any) {
    console.error("Error getting video status:", error)
    throw error
  }
}

/**
 * Delete video from Bunny Stream
 */
export async function deleteBunnyVideo(videoId: string): Promise<void> {
  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
    throw new Error("Bunny.net Stream API credentials not configured")
  }

  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`,
      {
        method: "DELETE",
        headers: {
          "AccessKey": BUNNY_STREAM_API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to delete video")
    }
  } catch (error: any) {
    console.error("Error deleting video:", error)
    throw error
  }
}
