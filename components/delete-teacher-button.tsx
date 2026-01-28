"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { removeTeacher } from "@/app/actions/admin"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

interface DeleteTeacherButtonProps {
  teacherId: string
  teacherName: string
}

export function DeleteTeacherButton({ teacherId, teacherName }: DeleteTeacherButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const result = await removeTeacher(teacherId)

      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error || "Failed to remove teacher")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
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
          Remove
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Remove Teacher</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{teacherName}</strong>? This action will:
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Delete the teacher account</li>
              <li>Delete their classroom</li>
              <li>Delete all courses, lessons, quizzes, and exams</li>
              <li>Remove all student enrollments</li>
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
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Teacher
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
