"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BookOpen, FileText, GraduationCap, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProgressBarDialogProps {
  lessonsCompleted: number
  materialsCompleted: number
  assignmentsCompleted: number
  examsCompleted: number
  children: React.ReactNode
}

export function ProgressBarDialog({
  lessonsCompleted,
  materialsCompleted,
  assignmentsCompleted,
  examsCompleted,
  children,
}: ProgressBarDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div>
        {children}
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 text-xs text-slate-blue hover:text-deep-teal hover:bg-deep-teal/5 border-gray-300"
          >
            Show More
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Completion Details</DialogTitle>
          <DialogDescription>
            Breakdown of completed items
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold text-deep-teal">Video Lectures</div>
                <div className="text-sm text-slate-blue">
                  {lessonsCompleted} {lessonsCompleted === 1 ? "lecture" : "lectures"} completed
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-deep-teal">Course Materials</div>
                <div className="text-sm text-slate-blue">
                  {materialsCompleted} {materialsCompleted === 1 ? "material" : "materials"} accessed
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-deep-teal">Assignments</div>
                <div className="text-sm text-slate-blue">
                  {assignmentsCompleted} {assignmentsCompleted === 1 ? "assignment" : "assignments"} completed
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-deep-teal">Exams</div>
                <div className="text-sm text-slate-blue">
                  {examsCompleted} {examsCompleted === 1 ? "exam" : "exams"} completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
