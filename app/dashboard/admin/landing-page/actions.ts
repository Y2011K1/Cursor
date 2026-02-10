"use server"

import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/admin"
import { requireRole } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function refreshPlatformStats() {
  const supabase = await createClient()
  const { error } = await supabase.rpc("refresh_platform_stats")
  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function saveAboutSection(formData: FormData) {
  const supabase = await createClient()
  const heading = formData.get("heading") as string
  const subheading = formData.get("subheading") as string
  const vision = formData.get("vision") as string
  const mission = formData.get("mission") as string
  const content = formData.get("content") as string
  const image_url = (formData.get("image_url") as string) || null

  const { data: existing } = await supabase.from("about_section").select("id").limit(1).single()
  if (existing) {
    const { error } = await supabase
      .from("about_section")
      .update({ heading, subheading, vision, mission, content, image_url })
      .eq("id", existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from("about_section")
      .insert({ heading, subheading, vision, mission, content, image_url })
    if (error) return { error: error.message }
  }
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient()
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const background_color = (formData.get("background_color") as string) || "#3b82f6"
  const text_color = (formData.get("text_color") as string) || "#ffffff"
  const is_active = formData.get("is_active") === "on"

  const { error } = await supabase.from("announcements").insert({
    title: title || "Announcement",
    content: content || "",
    background_color,
    text_color,
    is_active,
  })
  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const supabase = await createClient()
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const background_color = (formData.get("background_color") as string) || "#3b82f6"
  const text_color = (formData.get("text_color") as string) || "#ffffff"
  const is_active = formData.get("is_active") === "on"

  const { error } = await supabase
    .from("announcements")
    .update({ title, content, background_color, text_color, is_active })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("announcements").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function createSlide(formData: FormData) {
  const supabase = await createClient()
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const cta_text = (formData.get("cta_text") as string) || null
  const cta_link = (formData.get("cta_link") as string) || null
  const image_url = (formData.get("image_url") as string) || null
  const display_order = parseInt((formData.get("display_order") as string) || "0", 10)
  const is_active = formData.get("is_active") === "on"

  const { error } = await supabase.from("homepage_slides").insert({
    title: title || "Slide",
    description: description || null,
    cta_text,
    cta_link,
    image_url,
    display_order,
    is_active,
  })
  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function updateSlide(id: string, formData: FormData) {
  const supabase = await createClient()
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const cta_text = (formData.get("cta_text") as string) || null
  const cta_link = (formData.get("cta_link") as string) || null
  const image_url = (formData.get("image_url") as string) || null
  const display_order = parseInt((formData.get("display_order") as string) || "0", 10)
  const is_active = formData.get("is_active") === "on"

  const { error } = await supabase
    .from("homepage_slides")
    .update({ title, description, cta_text, cta_link, image_url, display_order, is_active })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function deleteSlide(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("homepage_slides").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function reorderSlide(formData: FormData) {
  await requireRole("admin")
  const slideId = formData.get("slideId") as string
  const direction = formData.get("direction") as "up" | "down"
  if (!slideId || !direction) return { error: null }
  const admin = getAdminClient()
  const { data: slides } = await admin
    .from("homepage_slides")
    .select("id, display_order")
    .order("display_order", { ascending: true })

  if (!slides || slides.length < 2) return { error: null }
  const idx = slides.findIndex((s: any) => s.id === slideId)
  if (idx < 0) return { error: "Slide not found" }
  const swapIdx = direction === "up" ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= slides.length) return { error: null }

  const current = slides[idx]
  const other = slides[swapIdx]
  await admin.from("homepage_slides").update({ display_order: other.display_order }).eq("id", current.id)
  await admin.from("homepage_slides").update({ display_order: current.display_order }).eq("id", other.id)
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function createTestimonial(formData: FormData) {
  const supabase = await createClient()
  const student_name = formData.get("student_name") as string
  const student_role_or_course = (formData.get("student_role_or_course") as string) || null
  const rating = parseInt((formData.get("rating") as string) || "5", 10)
  const quote = formData.get("quote") as string
  const display_order = parseInt((formData.get("display_order") as string) || "0", 10)
  const is_active = formData.get("is_active") === "on"

  const { error } = await supabase.from("testimonials").insert({
    student_name: student_name || "Student",
    student_role_or_course,
    rating: Math.min(5, Math.max(1, rating)),
    quote: quote || "",
    display_order,
    is_active,
  })
  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function updateTestimonial(id: string, formData: FormData) {
  await requireRole("admin")
  const admin = getAdminClient()
  const student_name = formData.get("student_name") as string
  const student_role_or_course = (formData.get("student_role_or_course") as string) || null
  const rating = parseInt((formData.get("rating") as string) || "5", 10)
  const quote = formData.get("quote") as string
  const display_order = parseInt((formData.get("display_order") as string) || "0", 10)
  const is_active = formData.get("is_active") === "on"

  const { error } = await admin
    .from("testimonials")
    .update({
      student_name: student_name || "Student",
      student_role_or_course,
      rating: Math.min(5, Math.max(1, rating)),
      quote: quote || "",
      display_order,
      is_active,
    })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function deleteTestimonial(id: string) {
  await requireRole("admin")
  const admin = getAdminClient()
  const { error } = await admin.from("testimonials").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function reorderTestimonial(formData: FormData) {
  await requireRole("admin")
  const testimonialId = formData.get("testimonialId") as string
  const direction = formData.get("direction") as "up" | "down"
  if (!testimonialId || !direction) return { error: null }
  const admin = getAdminClient()
  const { data: list } = await admin
    .from("testimonials")
    .select("id, display_order")
    .order("display_order", { ascending: true })
  if (!list || list.length < 2) return { error: null }
  const idx = list.findIndex((t: { id: string }) => t.id === testimonialId)
  if (idx < 0) return { error: null }
  const swapIdx = direction === "up" ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= list.length) return { error: null }
  const current = list[idx]
  const other = list[swapIdx]
  await admin.from("testimonials").update({ display_order: other.display_order }).eq("id", current.id)
  await admin.from("testimonials").update({ display_order: current.display_order }).eq("id", other.id)
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}

export async function updateSlideOrder(slideId: string, displayOrder: number) {
  await requireRole("admin")
  const admin = getAdminClient()
  const { error } = await admin
    .from("homepage_slides")
    .update({ display_order: displayOrder })
    .eq("id", slideId)
  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/dashboard/admin/landing-page")
  return { error: null }
}
