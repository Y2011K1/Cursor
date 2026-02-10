"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"

const LANDING_CACHE_TAG = "landing"

export async function createTestimonialAsStudent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()
  if (profile?.role !== "student") return { error: "Only students can submit testimonials" }

  const quote = (formData.get("quote") as string)?.trim()
  if (!quote) return { error: "Quote is required" }

  // Idempotency: avoid duplicate if same user submitted same quote in last 60 seconds (e.g. double-click)
  const { data: recent } = await supabase
    .from("testimonials")
    .select("id")
    .eq("student_id", user.id)
    .eq("quote", quote)
    .gte("created_at", new Date(Date.now() - 60_000).toISOString())
    .limit(1)
  if (recent?.length) {
    revalidateTag(`${LANDING_CACHE_TAG}-deferred`, "max")
    return { error: null }
  }

  const rating = Math.min(5, Math.max(1, parseInt((formData.get("rating") as string) || "5", 10)))
  const student_role_or_course = (formData.get("student_role_or_course") as string)?.trim() || null

  const { error } = await supabase.from("testimonials").insert({
    student_id: user.id,
    student_name: profile.full_name || "Student",
    student_role_or_course,
    rating,
    quote,
    is_active: true,
    display_order: 0,
  })

  if (error) return { error: error.message }
  revalidateTag(`${LANDING_CACHE_TAG}-deferred`, "max")
  revalidatePath("/dashboard/student")
  return { error: null }
}
