"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { GraduationCap, LogOut, User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface NavigationProps {
  userRole?: "admin" | "teacher" | "student"
  userName?: string
}

export function Navigation({ userRole, userName }: NavigationProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      // Show loading briefly before redirect
      await new Promise(resolve => setTimeout(resolve, 300))
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
      setIsLoggingOut(false)
    }
  }

  const getDashboardLink = () => {
    switch (userRole) {
      case "admin":
        return "/dashboard/admin"
      case "teacher":
        return "/dashboard/teacher"
      case "student":
        return "/dashboard/student"
      default:
        return "/dashboard"
    }
  }

  const getRoleBadge = () => {
    if (!userRole) return null
    
    const roleColors = {
      admin: "bg-warm-coral text-white",
      teacher: "bg-deep-teal text-white",
      student: "bg-soft-mint text-dark-text"
    }
    
    const roleLabels = {
      admin: "Admin",
      teacher: "Teacher",
      student: "Student"
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[userRole]}`}>
        {roleLabels[userRole]}
      </span>
    )
  }

  return (
    <nav className="bg-white border-b border-input shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            {getRoleBadge()}
            <Link href={getDashboardLink()} className="flex items-center gap-2">
              <div className="rounded-full bg-deep-teal p-2">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-deep-teal text-lg">EduPlatform</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {userName && (
              <div className="flex items-center gap-2 text-slate-blue">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{userName}</span>
              </div>
            )}
            <Link href="/dashboard/settings">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-blue hover:text-deep-teal"
              >
                Settings
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-slate-blue hover:text-deep-teal"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
