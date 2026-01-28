"use client"

import { Button } from "@/components/ui/button"

export function EditClassroomButton() {
  return (
    <Button 
      className="w-full" 
      variant="outline"
      onClick={() => {
        // TODO: Implement classroom edit functionality
        alert("Classroom editing will be available soon")
      }}
    >
      Edit Classroom Details
    </Button>
  )
}
