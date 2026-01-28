"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface PublishExamButtonProps {
  examId: string
  isPublished: boolean
}

export function PublishExamButton({ examId, isPublished }: PublishExamButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleToggle = async () => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("exams")
        .update({ is_published: !isPublished })
        .eq("id", examId)

      if (error) {
        alert(`Failed to ${isPublished ? 'unpublish' : 'publish'} exam: ${error.message}`)
      } else {
        router.refresh()
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isUpdating}
      className={isPublished ? "text-success-green border-success-green" : ""}
    >
      {isUpdating ? (
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
