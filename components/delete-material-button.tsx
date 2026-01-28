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

interface DeleteMaterialButtonProps {
  materialId: string
  materialTitle: string
  classroomId: string
}

export function DeleteMaterialButton({ materialId, materialTitle, classroomId }: DeleteMaterialButtonProps) {
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
        .from("course_materials")
        .delete()
        .eq("id", materialId)

      if (deleteError) {
        setError(deleteError.message || "Failed to delete material")
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
          <DialogTitle className="text-deep-teal">Delete Course Material</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{materialTitle}</strong>? This action cannot be undone.
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
                Delete Material
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
