"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Track when a student accesses/downloads a course material
 * This awards 1 point per material accessed
 */
export async function trackMaterialAccess(materialId: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  // Insert or ignore if already exists (upsert with ON CONFLICT DO NOTHING)
  const { error } = await supabase
    .from("material_access")
    .insert({
      student_id: user.id,
      material_id: materialId,
    })
    .select()
    .single()

  // If it's a duplicate key error, that's fine - material was already accessed
  if (error && error.code !== "23505") {
    console.error("Error tracking material access:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard/student")
  revalidatePath("/dashboard/student/course-materials")
  
  return { success: true }
}
