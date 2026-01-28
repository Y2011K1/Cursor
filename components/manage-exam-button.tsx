"use client"

import { Button } from "@/components/ui/button"

export function ManageExamButton() {
  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => {
        // TODO: Implement exam management functionality
        alert("Exam management will be available soon")
      }}
    >
      Manage
    </Button>
  )
}
