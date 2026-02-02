/**
 * Bunny.net Video Streaming API Integration
 * Handles video uploads and management.
 * Credentials are read at runtime so they work in server actions and API routes.
 */

const BUNNY_CONFIG_MSG =
  "Bunny.net is not configured. In .env.local add BUNNY_STREAM_LIBRARY_ID and BUNNY_STREAM_API_KEY (from Bunny dashboard → Stream → your library → API). Restart the dev server after saving."

function getBunnyConfig(): { libraryId: string; apiKey: string } {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID
  const apiKey = process.env.BUNNY_STREAM_API_KEY
  if (!libraryId?.trim() || !apiKey?.trim()) {
    throw new Error(BUNNY_CONFIG_MSG)
  }
  return { libraryId: libraryId.trim(), apiKey: apiKey.trim() }
}

/**
 * Create a video object in Bunny Stream library
 */
export async function createBunnyVideo(title: string): Promise<{ videoId: string; videoLibraryId: number } | null> {
  const { libraryId, apiKey } = getBunnyConfig()

  const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    method: "POST",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: title.trim() || "Untitled" }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Bunny create video failed (${response.status}): ${text || response.statusText}`)
  }

  const data = (await response.json()) as { guid?: string; videoLibraryId?: number }
  if (!data?.guid) {
    throw new Error("Bunny did not return a video ID")
  }
  return {
    videoId: data.guid,
    videoLibraryId: data.videoLibraryId ?? Number(libraryId),
  }
}

/**
 * Upload video file to Bunny Stream
 */
export async function uploadVideoToBunny(videoId: string, videoFile: File | Blob): Promise<string> {
  const { libraryId, apiKey } = getBunnyConfig()

  const arrayBuffer = await videoFile.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const response = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    {
      method: "PUT",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/octet-stream",
      },
      body: buffer,
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Bunny upload failed (${response.status}): ${text || response.statusText}`)
  }

  return `https://vz-${libraryId}.b-cdn.net/${videoId}/play_480p.mp4`
}

/**
 * Get video status and details
 */
export async function getBunnyVideoStatus(videoId: string): Promise<unknown> {
  const { libraryId, apiKey } = getBunnyConfig()
  const response = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    { method: "GET", headers: { AccessKey: apiKey } }
  )
  if (!response.ok) throw new Error("Failed to get video status")
  return response.json()
}

/**
 * Delete video from Bunny Stream
 */
export async function deleteBunnyVideo(videoId: string): Promise<void> {
  const { libraryId, apiKey } = getBunnyConfig()
  const response = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    { method: "DELETE", headers: { AccessKey: apiKey } }
  )
  if (!response.ok) throw new Error("Failed to delete video")
}
