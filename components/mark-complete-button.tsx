"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface MarkCompleteButtonProps {
  lessonId: string
  studentId: string
  isCompleted: boolean
}

export function MarkCompleteButton({ lessonId, studentId, isCompleted }: MarkCompleteButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [completed, setCompleted] = useState(isCompleted)
  const router = useRouter()
  const supabase = createClient()

  const handleToggle = async () => {
    setIsUpdating(true)

    try {
      if (completed) {
        // Mark as incomplete
        const { error } = await supabase
          .from("lesson_progress")
          .update({
            is_completed: false,
            completed_at: null,
          })
          .eq("lesson_id", lessonId)
          .eq("student_id", studentId)

        if (error) throw error
        setCompleted(false)
      } else {
        // Mark as complete
        const { error } = await supabase
          .from("lesson_progress")
          .upsert({
            lesson_id: lessonId,
            student_id: studentId,
            is_completed: true,
            completed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
          })

        if (error) throw error
        setCompleted(true)
      }

      router.refresh()
    } catch (error: any) {
      console.error("Error updating lesson progress:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isUpdating}
      className={completed ? "bg-success-green hover:bg-success-green/90" : "bg-deep-teal hover:bg-deep-teal/90"}
    >
      {isUpdating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Updating...
        </>
      ) : completed ? (
        <>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Mark as Incomplete
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Mark as Complete
        </>
      )}
    </Button>
  )
}
