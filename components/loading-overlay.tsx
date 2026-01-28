"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function LoadingOverlay() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPath, setLoadingPath] = useState<string | null>(null)

  useEffect(() => {
    // Show loading when pathname changes
    if (pathname) {
      setIsLoading(true)
      setLoadingPath(pathname)
      
      // Hide loading after a short delay (navigation should be complete)
      const timer = setTimeout(() => {
        setIsLoading(false)
        setLoadingPath(null)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-deep-teal mx-auto mb-4" />
            <p className="text-slate-blue font-medium">Loading...</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
