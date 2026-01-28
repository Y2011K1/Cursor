"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

interface DeleteQuizButtonProps {
  quizId: string
  quizTitle: string
  classroomId: string
}

export function DeleteQuizButton({ quizId, quizTitle, classroomId }: DeleteQuizButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId)

      if (deleteError) {
        setError(deleteError.message || "Failed to delete quiz")
        setIsDeleting(false)
        return
      }

      setOpen(false)
      router.push(`/dashboard/teacher/classroom/${classroomId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-warm-coral hover:text-warm-coral hover:bg-warm-coral/10 border-warm-coral"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Delete Quiz</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{quizTitle}</strong>? This action will:
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Delete the quiz and all its questions</li>
              <li>Delete all student submissions</li>
            </ul>
            <span className="text-warm-coral font-semibold mt-2 block">This action cannot be undone.</span>
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Quiz
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
