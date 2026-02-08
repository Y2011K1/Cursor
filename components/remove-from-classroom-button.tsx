"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserMinus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

interface RemoveFromClassroomButtonProps {
  studentId: string
  studentName: string
  courseId?: string
  courseName?: string
  classroomId?: string
  classroomName?: string
}

export function RemoveFromClassroomButton({
  studentId,
  studentName,
  courseId: courseIdProp,
  courseName: courseNameProp,
  classroomId,
  classroomName
}: RemoveFromClassroomButtonProps) {
  const courseId = courseIdProp ?? classroomId ?? ''
  const courseName = courseNameProp ?? classroomName ?? 'Unknown'
  const [open, setOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleRemove = async () => {
    setIsRemoving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/remove-from-classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, courseId })
      })

      const result = await response.json()

      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error || "Failed to remove student from course")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300"
        >
          <UserMinus className="h-4 w-4 mr-2" />
          Remove from Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-deep-teal">
            Remove from Course
          </DialogTitle>
          <DialogDescription>
            Remove <strong>{studentName}</strong> from <strong>{courseName}</strong>?
            
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-semibold text-gray-900">This will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Remove the student from this course only</li>
                <li>Keep their account active</li>
                <li>Preserve their data in other courses</li>
              </ul>
              <p className="text-blue-600 font-medium mt-3">
                ℹ️ The student can re-enroll later if needed
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
            disabled={isRemoving}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleRemove}
            disabled={isRemoving}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isRemoving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <UserMinus className="h-4 w-4 mr-2" />
                Remove from Course
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
