import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const BUCKET = "teacher-avatars"
const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

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
      return NextResponse.json({ error: "Only teachers can upload a profile picture." }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("image") as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Use a JPEG, PNG, WebP, or GIF image." },
        { status: 400 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be 5MB or smaller." },
        { status: 400 }
      )
    }

    const ext = file.name.split(".").pop() || "jpg"
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      if (uploadError.message?.includes("Bucket not found")) {
        return NextResponse.json(
          {
            error:
              "Storage bucket 'teacher-avatars' not found. Create a public bucket named 'teacher-avatars' in Supabase Dashboard → Storage.",
          },
          { status: 502 }
        )
      }
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path)
    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error("Profile picture upload error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    )
  }
}
