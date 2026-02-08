"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/#", label: "Home" },
  { href: "/#courses", label: "Courses" },
  { href: "/teachers", label: "Teachers" },
  { href: "/blog", label: "Blog" },
  { href: "/#about", label: "About" },
]

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-deep-teal transition-opacity hover:opacity-90"
          aria-label="EduPlatform Home"
        >
          <span className="text-xl md:text-2xl">EduPlatform</span>
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-8" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-deep-teal/90 transition-colors hover:text-deep-teal"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex md:items-center md:gap-3">
          <Button variant="outline" asChild className="border-deep-teal text-deep-teal">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-deep-teal to-success-green text-white hover:opacity-90">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-md text-deep-teal hover:bg-deep-teal/10"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-white/95 backdrop-blur md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-deep-teal hover:bg-deep-teal/10"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t pt-4">
              <Button variant="outline" asChild className="border-deep-teal text-deep-teal">
                <Link href="/login" onClick={() => setMobileOpen(false)}>Log In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-deep-teal to-success-green text-white">
                <Link href="/signup" onClick={() => setMobileOpen(false)}>Sign Up</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
