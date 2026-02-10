import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Show fallback font while loading
  preload: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "EduPlatform – Learn Smarter. Learn Better.",
  description: "Expert instructors and structured courses help you succeed. Join thousands of students on EduPlatform.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        )}
      </head>
      <body className="font-sans">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
