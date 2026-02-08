"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateTeacherProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "teacher") return { error: "Only teachers can update teacher profile" }

  const profile_picture_url = (formData.get("profile_picture_url") as string)?.trim() || null
  const bio = (formData.get("bio") as string)?.trim() || null
  const years_experience = formData.get("years_experience") ? parseInt(formData.get("years_experience") as string, 10) : null
  const birthdateRaw = (formData.get("birthdate") as string)?.trim()
  const birthdate = birthdateRaw ? birthdateRaw : null
  const education = (formData.get("education") as string)?.trim() || null
  const teaching_philosophy = (formData.get("teaching_philosophy") as string)?.trim() || null
  const linkedin_url = (formData.get("linkedin_url") as string)?.trim() || null
  const twitter_url = (formData.get("twitter_url") as string)?.trim() || null
  const specializationsStr = (formData.get("specializations") as string)?.trim()
  const specializations = specializationsStr ? specializationsStr.split(",").map((s) => s.trim()).filter(Boolean) : null
  const qualificationsStr = (formData.get("qualifications") as string)?.trim()
  const qualifications = qualificationsStr ? qualificationsStr.split(",").map((s) => s.trim()).filter(Boolean) : null

  const payload: Record<string, unknown> = {
    user_id: user.id,
    profile_picture_url,
    bio,
    education,
    teaching_philosophy,
    linkedin_url,
    twitter_url,
  }
  if (years_experience != null) payload.years_experience = years_experience
  if (birthdate) payload.birthdate = birthdate
  if (specializations) payload.specializations = specializations
  if (qualifications) payload.qualifications = qualifications

  const { error } = await supabase
    .from("teacher_profiles")
    .upsert(payload, { onConflict: "user_id" })

  if (error) return { error: error.message }
  revalidatePath("/dashboard/settings")
  revalidatePath("/")
  revalidatePath("/teachers")
  revalidatePath("/teachers/[teacherId]")
  return { error: null }
}
