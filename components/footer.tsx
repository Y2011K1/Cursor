import Link from "next/link"
import { GraduationCap, Mail, Github, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-deep-teal text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white p-2">
                <GraduationCap className="h-5 w-5 text-deep-teal" />
              </div>
              <span className="font-bold text-lg">EduPlatform</span>
            </div>
            <p className="text-white/80 text-sm">
              A focused, secure, and humane teaching platform designed to enhance the learning experience for students and educators.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard/student" className="text-white/80 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/student/browse" className="text-white/80 hover:text-white transition-colors">
                  Browse Classrooms
                </Link>
              </li>
              <li>
                <Link href="/dashboard/settings" className="text-white/80 hover:text-white transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-white/80">
                <Mail className="h-4 w-4" />
                <span>support@eduplatform.com</span>
              </li>
            </ul>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="#"
                className="text-white/80 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-white/80 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-6 text-center text-sm text-white/60">
          <p>© {new Date().getFullYear()} EduPlatform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
