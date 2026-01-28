"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, ChevronDown, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Classroom {
  id: string
  name: string
  subject: string | null
}

interface ClassroomSwitcherProps {
  currentClassroomId?: string
  classrooms: Classroom[]
}

export function ClassroomSwitcher({ currentClassroomId, classrooms }: ClassroomSwitcherProps) {
  const router = useRouter()
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)

  useEffect(() => {
    if (currentClassroomId && classrooms.length > 0) {
      const current = classrooms.find((c) => c.id === currentClassroomId)
      setSelectedClassroom(current || classrooms[0] || null)
    } else if (classrooms.length > 0 && !selectedClassroom) {
      setSelectedClassroom(classrooms[0])
    }
  }, [currentClassroomId, classrooms])

  if (classrooms.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full md:w-auto justify-between gap-2 bg-white hover:bg-light-sky border-deep-teal/20"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-deep-teal" />
            <span className="text-deep-teal font-medium">
              {selectedClassroom?.name || "Select Classroom"}
            </span>
            {selectedClassroom?.subject && (
              <span className="text-xs text-slate-blue hidden md:inline">
                ({selectedClassroom.subject})
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-slate-blue" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Classrooms</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {classrooms.map((classroom) => (
          <DropdownMenuItem
            key={classroom.id}
            asChild
            className="cursor-pointer"
          >
            <Link
              href={`/dashboard/student/classroom/${classroom.id}`}
              className="flex items-center justify-between w-full"
            >
              <div className="flex flex-col">
                <span className="font-medium">{classroom.name}</span>
                {classroom.subject && (
                  <span className="text-xs text-slate-blue">{classroom.subject}</span>
                )}
              </div>
              {selectedClassroom?.id === classroom.id && (
                <Check className="h-4 w-4 text-success-green" />
              )}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/student/browse"
            className="flex items-center gap-2 text-deep-teal font-medium"
          >
            <BookOpen className="h-4 w-4" />
            Browse More Classrooms
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
