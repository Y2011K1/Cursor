"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toggleCoursePublish } from "@/app/actions/course"
import { Eye, EyeOff, Loader2 } from "lucide-react"

interface PublishCourseButtonProps {
  courseId: string
  isPublished: boolean
}

export function PublishCourseButton({ courseId, isPublished }: PublishCourseButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const result = await toggleCoursePublish(courseId, isPublished)
      if (result.success) {
        router.refresh()
      }
    } catch (error) {
      console.error("Error toggling publish:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      className="w-full bg-deep-teal hover:bg-deep-teal/90"
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {isPublished ? "Unpublishing..." : "Publishing..."}
        </>
      ) : (
        <>
          {isPublished ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Unpublish Course
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Publish Course
            </>
          )}
        </>
      )}
    </Button>
  )
}
