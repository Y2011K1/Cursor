"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toggleQuizPublish } from "@/app/actions/quiz"
import { Eye, EyeOff, Loader2 } from "lucide-react"

interface PublishQuizButtonProps {
  quizId: string
  isPublished: boolean
}

export function PublishQuizButton({ quizId, isPublished }: PublishQuizButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const result = await toggleQuizPublish(quizId, isPublished)
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
              Unpublish Quiz
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Publish Quiz
            </>
          )}
        </>
      )}
    </Button>
  )
}
