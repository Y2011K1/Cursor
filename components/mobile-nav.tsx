"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "./ui/button"
import { Navigation } from "./navigation"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  userRole?: "admin" | "teacher" | "student"
  userName?: string
}

export function MobileNav({ userRole, userName }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-deep-teal" />
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Side panel */}
          <div
            className="absolute right-0 top-0 h-full w-[300px] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-bold text-deep-teal">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation content */}
              <div className="flex-1 overflow-y-auto p-4">
                <nav className="flex flex-col gap-2">
                  <a
                    href={userRole === "admin" ? "/dashboard/admin" : userRole === "teacher" ? "/dashboard/teacher" : "/dashboard/student"}
                    className="px-4 py-3 rounded-lg hover:bg-light-sky transition-colors text-deep-teal font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </a>
                  {userRole === "student" && (
                    <>
                      <a
                        href="/dashboard/student/video-lectures"
                        className="px-4 py-3 rounded-lg hover:bg-light-sky transition-colors text-slate-blue"
                        onClick={() => setIsOpen(false)}
                      >
                        Video Lectures
                      </a>
                      <a
                        href="/dashboard/student/assignments"
                        className="px-4 py-3 rounded-lg hover:bg-light-sky transition-colors text-slate-blue"
                        onClick={() => setIsOpen(false)}
                      >
                        Assignments
                      </a>
                      <a
                        href="/dashboard/student/exams"
                        className="px-4 py-3 rounded-lg hover:bg-light-sky transition-colors text-slate-blue"
                        onClick={() => setIsOpen(false)}
                      >
                        Exams
                      </a>
                    </>
                  )}
                  {userRole === "admin" && (
                    <>
                      <a
                        href="/dashboard/admin/teachers"
                        className="px-4 py-3 rounded-lg hover:bg-light-sky transition-colors text-slate-blue"
                        onClick={() => setIsOpen(false)}
                      >
                        Teachers
                      </a>
                      <a
                        href="/dashboard/admin/students"
                        className="px-4 py-3 rounded-lg hover:bg-light-sky transition-colors text-slate-blue"
                        onClick={() => setIsOpen(false)}
                      >
                        Students
                      </a>
                      <a
                        href="/dashboard/admin/landing-page"
                        className="px-4 py-3 rounded-lg hover:bg-light-sky transition-colors text-slate-blue"
                        onClick={() => setIsOpen(false)}
                      >
                        Landing Page
                      </a>
                      <a
                        href="/dashboard/admin/blog"
                        className="px-4 py-3 rounded-lg hover:bg-light-sky transition-colors text-slate-blue"
                        onClick={() => setIsOpen(false)}
                      >
                        Blog
                      </a>
                    </>
                  )}
                  {userRole === "teacher" && (
                    <>
                      <a
                        href="/dashboard/teacher"
                        className="px-4 py-3 rounded-lg hover:bg-light-sky transition-colors text-slate-blue"
                        onClick={() => setIsOpen(false)}
                      >
                        My Classroom
                      </a>
                    </>
                  )}
                  <a
                    href="/dashboard/settings"
                    className="px-4 py-3 rounded-lg hover:bg-light-sky transition-colors text-slate-blue"
                    onClick={() => setIsOpen(false)}
                  >
                    Settings
                  </a>
                </nav>
              </div>

              {/* Footer with user info */}
              {userName && (
                <div className="p-4 border-t">
                  <div className="text-sm text-slate-blue">
                    <div className="font-medium">{userName}</div>
                    {userRole && (
                      <div className="text-xs mt-1 capitalize">{userRole}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
