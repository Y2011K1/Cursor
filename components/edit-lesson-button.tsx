"use client"

import { Button } from "@/components/ui/button"

export function EditLessonButton() {
  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => {
        // TODO: Implement lesson edit functionality
        alert("Lesson editing will be available soon")
      }}
    >
      Edit
    </Button>
  )
}
