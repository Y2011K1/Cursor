"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronDown, Check } from "lucide-react"

interface Course {
  id: string
  name: string
  subject: string | null
}

interface CourseSwitcherProps {
  courses: Course[]
  activeCourseId: string
}

export function CourseSwitcher({ courses, activeCourseId }: CourseSwitcherProps) {
  const router = useRouter()

  if (courses.length <= 1) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-white text-deep-teal border-white/30 hover:bg-white/90">
          <BookOpen className="h-4 w-4 mr-2" />
          Switch Course
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {courses.map((course) => (
          <DropdownMenuItem
            key={course.id}
            className="cursor-pointer"
            onClick={() => router.push(`/dashboard/student?course=${course.id}`)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="font-medium">{course.name}</span>
                {course.subject && (
                  <span className="text-xs text-slate-blue">{course.subject}</span>
                )}
              </div>
              {course.id === activeCourseId && (
                <Check className="h-4 w-4 text-success-green ml-2 shrink-0" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
