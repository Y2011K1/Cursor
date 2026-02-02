import { NextResponse } from "next/server"

/**
 * Bunny Stream webhook endpoint.
 * Bunny sends a POST when a video's encoding status changes.
 * Payload: { VideoLibraryId: number, VideoGuid: string, Status: number }
 * Status: 0=Queued, 1=Processing, 2=Encoding, 3=Finished, 4=Resolution finished, 5=Failed, etc.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { VideoLibraryId, VideoGuid, Status } = body as {
      VideoLibraryId?: number
      VideoGuid?: string
      Status?: number
    }

    if (VideoGuid === undefined || Status === undefined) {
      return NextResponse.json(
        { error: "Missing VideoGuid or Status" },
        { status: 400 }
      )
    }

    // Optional: verify VideoLibraryId matches your BUNNY_STREAM_LIBRARY_ID
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID
    if (libraryId && VideoLibraryId !== undefined && Number(libraryId) !== VideoLibraryId) {
      return NextResponse.json(
        { error: "Library ID mismatch" },
        { status: 400 }
      )
    }

    // Handle status (e.g. log, update DB, notify)
    // Status 3 = Finished, 4 = first resolution done (playable), 5 = Failed
    if (Status === 3) {
      // Encoding finished – video fully available
      console.log(`[Bunny webhook] Video ${VideoGuid} encoding finished`)
    } else if (Status === 4) {
      // First resolution done – video is playable
      console.log(`[Bunny webhook] Video ${VideoGuid} is now playable`)
    } else if (Status === 5) {
      console.error(`[Bunny webhook] Video ${VideoGuid} encoding failed`)
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error("[Bunny webhook] Error:", e)
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    )
  }
}
