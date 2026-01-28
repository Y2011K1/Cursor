"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Loader2 } from "lucide-react"

interface PublishClassroomButtonProps {
  classroomId: string
  isActive: boolean
}

export function PublishClassroomButton({ classroomId, isActive }: PublishClassroomButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleToggle = async () => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("classrooms")
        .update({ is_active: !isActive })
        .eq("id", classroomId)

      if (error) {
        console.error("Error updating classroom:", error)
        alert("Failed to update classroom status")
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error("Error:", err)
      alert("An unexpected error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Button
      className="w-full"
      variant={isActive ? "outline" : "default"}
      onClick={handleToggle}
      disabled={isUpdating}
    >
      {isUpdating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Updating...
        </>
      ) : isActive ? (
        <>
          <EyeOff className="h-4 w-4 mr-2" />
          Deactivate Classroom
        </>
      ) : (
        <>
          <Eye className="h-4 w-4 mr-2" />
          Activate Classroom
        </>
      )}
    </Button>
  )
}
