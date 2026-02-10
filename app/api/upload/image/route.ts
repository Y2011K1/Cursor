import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

const FOLDER_ROLES: Record<string, "admin" | "teacher"> = {
  blog: "admin",
  "course-thumbnail": "teacher",
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to upload." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || ""

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 })
    }

    const requiredRole = FOLDER_ROLES[folder]
    if (!requiredRole) {
      return NextResponse.json(
        { error: "Invalid folder. Use 'blog' or 'course-thumbnail'." },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== requiredRole) {
      return NextResponse.json(
        { error: folder === "blog" ? "Only admins can upload blog images." : "Only teachers can upload course images." },
        { status: 403 }
      )
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
    const supabasePath =
      folder === "blog"
        ? `blog-images/${user.id}-${Date.now()}.${ext}`
        : `course-images/${user.id}-${Date.now()}.${ext}`

    const bucket = "public"
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(supabasePath, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      const altBucket = "uploads"
      const { data: altData, error: altError } = await supabase.storage
        .from(altBucket)
        .upload(supabasePath, file, { contentType: file.type, upsert: false })
      if (altError) {
        const msg = uploadError.message || altError.message || "Upload failed"
        const isPolicy =
          msg.includes("row-level security") ||
          msg.includes("policy") ||
          msg.includes("Permission denied") ||
          msg.includes("JWT")
        const hint = isPolicy
          ? " Storage RLS is blocking uploads. Run migration 117 (supabase db push) or add Storage policies in Dashboard → Storage → bucket → Policies."
          : msg.includes("Bucket not found") || msg.includes("not found")
            ? " Create a public bucket named 'public' or 'uploads' in Dashboard → Storage."
            : ""
        return NextResponse.json(
          { error: `Upload failed: ${msg}${hint}` },
          { status: 500 }
        )
      }
      const { data: urlData } = supabase.storage.from(altBucket).getPublicUrl(altData.path)
      return NextResponse.json({ url: urlData.publicUrl })
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path)
    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error("Image upload error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    )
  }
}
