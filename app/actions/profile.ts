"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/** Update the current user's display name (students and teachers). */
export async function updateDisplayName(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const full_name = (formData.get("full_name") as string)?.trim()
  if (!full_name || full_name.length < 1) return { error: "Name is required" }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name })
    .eq("id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")
  revalidatePath("/")
  return { error: null }
}
