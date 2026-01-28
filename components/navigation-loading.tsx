"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface NavigationLoadingProps {
  isLoading: boolean
  message?: string
}

export function NavigationLoading({ isLoading, message = "Redirecting..." }: NavigationLoadingProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-white/90 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-deep-teal mx-auto mb-4" />
            <p className="text-slate-blue font-medium text-lg">{message}</p>
            <p className="text-slate-blue/70 text-sm mt-2">Please wait...</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
