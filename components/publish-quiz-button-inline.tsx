"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toggleQuizPublish } from "@/app/actions/quiz"
import { Eye, EyeOff, Loader2 } from "lucide-react"

interface PublishQuizButtonInlineProps {
  quizId: string
  isPublished: boolean
}

export function PublishQuizButtonInline({ quizId, isPublished }: PublishQuizButtonInlineProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const result = await toggleQuizPublish(quizId, isPublished)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || "Failed to toggle publish status")
      }
    } catch (error) {
      console.error("Error toggling publish:", error)
      alert("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={isPublished ? "text-success-green border-success-green" : ""}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPublished ? (
        <>
          <EyeOff className="h-4 w-4 mr-2" />
          Unpublish
        </>
      ) : (
        <>
          <Eye className="h-4 w-4 mr-2" />
          Publish
        </>
      )}
    </Button>
  )
}
