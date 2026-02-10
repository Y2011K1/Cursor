"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LeaveTestimonialForm } from "@/components/leave-testimonial-form"
import { MessageCircle, Quote } from "lucide-react"

interface StudentTestimonialCardProps {
  /** Course name to prefill "Course or role" in the form */
  courseName?: string | null
}

export function StudentTestimonialCard({ courseName }: StudentTestimonialCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="border-none shadow-sm rounded-xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-200/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-deep-teal flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-amber-600" />
          Share your experience
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-blue">
          Finished some content? Your feedback helps other students and improves the platform. Write a short testimonial about your experience.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-amber-300 text-deep-teal hover:bg-amber-50 hover:border-amber-400">
              <Quote className="h-4 w-4 mr-2" />
              Write a testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share your experience</DialogTitle>
            </DialogHeader>
            <LeaveTestimonialForm
              defaultCourse={courseName}
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
