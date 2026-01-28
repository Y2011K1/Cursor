"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function checkTeacherEmail(email: string) {
  const supabase = await createClient()
  
  // Get user by email (this requires admin access, so we'll use a different approach)
  // For now, we'll check if a logged-in user is a teacher
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (profile?.role === "teacher" && user.email === email) {
      return { isTeacher: true }
    }
  }
  
  return { isTeacher: false }
}
