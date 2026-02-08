"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { leaveCourse } from "@/app/actions/course"
import { LogOut } from "lucide-react"
import { useState } from "react"

export function LeaveCourseButton({ courseId, courseName }: { courseId: string; courseName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const handleLeave = async () => {
    if (!confirm) {
      setConfirm(true)
      return
    }
    setLoading(true)
    const result = await leaveCourse(courseId)
    if (result.error) {
      setLoading(false)
      return
    }
    router.push("/dashboard/student")
    router.refresh()
  }

  return (
    <Button
      variant="outline"
      className="text-error-red border-error-red/50 hover:bg-error-red/10"
      onClick={handleLeave}
      disabled={loading}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {loading ? "Leaving…" : confirm ? "Confirm leave course?" : "Leave course"}
    </Button>
  )
}
