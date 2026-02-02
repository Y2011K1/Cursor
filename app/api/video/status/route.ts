import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getBunnyVideoStatus } from "@/lib/bunny"

export const dynamic = "force-dynamic"

/** Extract Bunny video GUID from CDN URL e.g. https://vz-xxx.b-cdn.net/GUID/play_480p.mp4 */
function getVideoIdFromUrl(videoUrl: string): string | null {
  try {
    const u = new URL(videoUrl)
    const pathParts = u.pathname.split("/").filter(Boolean)
    // path is like ["GUID", "play_480p.mp4"] or ["GUID"]
    if (pathParts.length >= 1 && pathParts[0] && pathParts[0].length > 10) {
      return pathParts[0]
    }
    return null
  } catch {
    return null
  }
}

/** Bunny status: 0=Queued, 1=Processing, 2=Encoding, 3=Finished, 4=Resolution finished (playable), 5=Failed */
const READY_STATUSES = [3, 4]

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")
    const videoUrl = searchParams.get("videoUrl")

    let id = videoId
    if (!id && videoUrl) {
      id = getVideoIdFromUrl(videoUrl)
    }
    if (!id) {
      return NextResponse.json(
        { error: "Missing videoId or valid videoUrl (Bunny CDN URL)" },
        { status: 400 }
      )
    }

    const data = (await getBunnyVideoStatus(id)) as { status?: number } | null
    if (!data || typeof data.status !== "number") {
      return NextResponse.json({ status: -1, ready: false, error: "Could not get status" }, { status: 200 })
    }

    const ready = READY_STATUSES.includes(data.status)
    return NextResponse.json({ status: data.status, ready })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get status"
    return NextResponse.json({ error: message, ready: false }, { status: 500 })
  }
}
