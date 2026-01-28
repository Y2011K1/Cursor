import { redirect } from "next/navigation"
import { getCurrentProfile, getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      redirect("/login")
    }

    // Check if profile exists
    let profile = await getCurrentProfile()
    
    if (!profile) {
      // Profile might not be created yet, check directly with a fresh client
      const supabase = await createClient()
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
        // If it's a not found error, redirect to debug page
        if (error.code === 'PGRST116') {
          redirect("/dashboard/debug?error=profile_not_found")
        }
        redirect("/dashboard/debug?error=fetch_error")
      }
      
      if (!profileData) {
        redirect("/dashboard/debug?error=profile_missing")
      }
      
      profile = profileData
    }

    // Validate profile has a role
    if (!profile || !profile.role) {
      redirect("/dashboard/debug?error=role_missing")
    }

    // Redirect based on role
    switch (profile.role) {
      case "admin":
        redirect("/dashboard/admin")
      case "teacher":
        redirect("/dashboard/teacher")
      case "student":
        redirect("/dashboard/student")
      default:
        redirect("/dashboard/debug?error=invalid_role")
    }
  } catch (error: any) {
    // If it's a redirect, re-throw it
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    // Otherwise, log and redirect to debug page
    console.error('Dashboard error:', error)
    redirect("/dashboard/debug?error=unknown")
  }
}
