"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface EnrollButtonProps {
  classroomId: string
  studentId: string
}

export function EnrollButton({ classroomId, studentId }: EnrollButtonProps) {
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleEnroll = async () => {
    setIsEnrolling(true)
    setError(null)

    try {
      const { error: enrollError } = await supabase
        .from("enrollments")
        .insert({
          student_id: studentId,
          classroom_id: classroomId,
          is_active: true,
        })

      if (enrollError) {
        setError(enrollError.message)
        setIsEnrolling(false)
        return
      }

      // Refresh the page to show updated enrollment status
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to enroll")
      setIsEnrolling(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full bg-deep-teal hover:bg-deep-teal/90"
        onClick={handleEnroll}
        disabled={isEnrolling}
      >
        {isEnrolling ? "Enrolling..." : "Join Classroom"}
      </Button>
      {error && (
        <p className="text-xs text-warm-coral text-center">{error}</p>
      )}
    </div>
  )
}
