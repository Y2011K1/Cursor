"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { removeStudent } from "@/app/actions/admin"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

interface DeleteStudentButtonProps {
  studentId: string
  studentName: string
}

export function DeleteStudentButton({ studentId, studentName }: DeleteStudentButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const result = await removeStudent(studentId)

      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error || "Failed to remove student")
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
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Remove Student</DialogTitle>
          <DialogDescription>
            Are you sure you want to <strong className="text-red-600">permanently delete</strong> <strong>{studentName}</strong>'s account?
            
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-semibold text-red-700">⚠️ WARNING: This action cannot be undone!</p>
              <p className="font-semibold text-gray-900">This will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Delete the student account completely</li>
                <li>Remove from ALL courses and delete all related data</li>
                <li>Delete all quiz and exam submissions</li>
                <li>Delete all lesson progress</li>
                <li>Block this email from signing up again</li>
              </ul>
              <p className="text-orange-600 font-medium mt-3">
                💡 To remove from just one classroom, use "Remove from Class" instead
              </p>
            </div>
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
                Delete Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
