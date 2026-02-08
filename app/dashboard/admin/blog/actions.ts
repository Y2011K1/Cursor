"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createPost(formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Not authenticated" }
  const supabase = await createClient()
  const title = (formData.get("title") as string)?.trim()
  const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "-") || undefined
  if (!title || !slug) return { error: "Title and slug are required" }
  const excerpt = (formData.get("excerpt") as string)?.trim() || null
  const content = (formData.get("content") as string)?.trim() || ""
  const featured_image_url = (formData.get("featured_image_url") as string)?.trim() || null
  const category_id = (formData.get("category_id") as string)?.trim() || null
  const status = ((formData.get("status") as string) || "draft") as "draft" | "published"

  const { error } = await supabase.from("blog_posts").insert({
    title,
    slug,
    excerpt,
    content,
    featured_image_url,
    category_id: category_id || null,
    author_id: profile.id,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  })
  if (error) return { error: error.message }
  revalidatePath("/blog")
  revalidatePath("/dashboard/admin/blog")
  revalidatePath("/")
  return { success: true, error: null }
}

export async function updatePost(formData: FormData) {
  const id = formData.get("id") as string
  if (!id) return { error: "Missing post id" }
  const supabase = await createClient()
  const title = (formData.get("title") as string)?.trim()
  const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "-")
  if (!title || !slug) return { error: "Title and slug are required" }
  const excerpt = (formData.get("excerpt") as string)?.trim() || null
  const content = (formData.get("content") as string)?.trim() || ""
  const featured_image_url = (formData.get("featured_image_url") as string)?.trim() || null
  const category_id = (formData.get("category_id") as string)?.trim() || null
  const status = ((formData.get("status") as string) || "draft") as "draft" | "published"

  const updates: Record<string, unknown> = {
    title,
    slug,
    excerpt,
    content,
    featured_image_url,
    category_id: category_id || null,
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === "published") {
    const { data: existing } = await supabase.from("blog_posts").select("published_at").eq("id", id).single()
    if (existing && !existing.published_at) updates.published_at = new Date().toISOString()
  }

  const { error } = await supabase.from("blog_posts").update(updates).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/blog")
  revalidatePath(`/blog/${slug}`)
  revalidatePath("/dashboard/admin/blog")
  revalidatePath("/")
  return { success: true, error: null }
}

export async function deletePost(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("blog_posts").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/blog")
  revalidatePath("/dashboard/admin/blog")
  revalidatePath("/")
  return { error: null }
}

export async function createCategory(formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Not authenticated" }
  const supabase = await createClient()
  const name = (formData.get("name") as string)?.trim()
  const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "-")
  const description = (formData.get("description") as string)?.trim() || null
  if (!name || !slug) return { error: "Name and slug are required" }
  const { error } = await supabase.from("blog_categories").insert({ name, slug, description })
  if (error) return { error: error.message }
  revalidatePath("/dashboard/admin/blog")
  revalidatePath("/dashboard/admin/blog/new")
  return { error: null }
}

const BLOG_LINK_TYPES = ["teacher", "student", "page", "image"] as const

export async function createBlogPostLink(formData: FormData) {
  const blogPostId = formData.get("blog_post_id") as string
  const linkType = formData.get("link_type") as string
  const title = (formData.get("title") as string)?.trim()
  const url = (formData.get("url") as string)?.trim()
  if (!blogPostId || !title || !url) return { error: "Post, title and URL are required" }
  if (!BLOG_LINK_TYPES.includes(linkType as any)) return { error: "Invalid link type" }
  const supabase = await createClient()
  const { data: max } = await supabase
    .from("blog_post_links")
    .select("display_order")
    .eq("blog_post_id", blogPostId)
    .order("display_order", { ascending: false })
    .limit(1)
    .single()
  const display_order = (max?.display_order ?? -1) + 1
  const { error } = await supabase
    .from("blog_post_links")
    .insert({ blog_post_id: blogPostId, link_type: linkType, title, url, display_order })
  if (error) return { error: error.message }
  revalidatePath("/blog")
  revalidatePath("/dashboard/admin/blog")
  revalidatePath(`/dashboard/admin/blog/${blogPostId}/edit`)
  return { error: null }
}

export async function deleteBlogPostLink(linkId: string) {
  const supabase = await createClient()
  const { data: link } = await supabase.from("blog_post_links").select("blog_post_id").eq("id", linkId).single()
  const { error } = await supabase.from("blog_post_links").delete().eq("id", linkId)
  if (error) return { error: error.message }
  if (link?.blog_post_id) revalidatePath(`/dashboard/admin/blog/${link.blog_post_id}/edit`)
  revalidatePath("/blog")
  revalidatePath("/dashboard/admin/blog")
  return { error: null }
}

export async function reorderBlogPostLink(formData: FormData) {
  const linkId = formData.get("linkId") as string
  const direction = formData.get("direction") as "up" | "down"
  if (!linkId || !direction) return { error: null }
  const supabase = await createClient()
  const { data: link } = await supabase.from("blog_post_links").select("blog_post_id").eq("id", linkId).single()
  if (!link) return { error: null }
  const { data: links } = await supabase
    .from("blog_post_links")
    .select("id, display_order")
    .eq("blog_post_id", link.blog_post_id)
    .order("display_order", { ascending: true })
  if (!links || links.length < 2) return { error: null }
  const idx = links.findIndex((l: any) => l.id === linkId)
  if (idx < 0) return { error: null }
  const swapIdx = direction === "up" ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= links.length) return { error: null }
  const current = links[idx]
  const other = links[swapIdx]
  await supabase.from("blog_post_links").update({ display_order: other.display_order }).eq("id", current.id)
  await supabase.from("blog_post_links").update({ display_order: current.display_order }).eq("id", other.id)
  revalidatePath(`/dashboard/admin/blog/${link.blog_post_id}/edit`)
  revalidatePath("/blog")
  revalidatePath("/dashboard/admin/blog")
  return { error: null }
}
