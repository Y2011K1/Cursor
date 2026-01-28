"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteCourse } from "@/app/actions/course"
import { Trash2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DeleteCourseButtonProps {
  courseId: string
}

export function DeleteCourseButton({ courseId }: DeleteCourseButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const result = await deleteCourse(courseId)
      if (result.success) {
        router.push("/dashboard/teacher/courses")
      } else {
        alert(result.error || "Failed to delete course")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("An error occurred while deleting the course")
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Course
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-warm-coral">Delete Course</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this course? This action cannot be undone and will delete all lessons, quizzes, and exams in this course.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="bg-warm-coral hover:bg-warm-coral/90"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Course"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
