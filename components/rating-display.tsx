"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingDisplayProps {
  rating: number
  totalRatings?: number
  size?: "sm" | "md" | "lg"
  showNumber?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
}

export function RatingDisplay({
  rating,
  totalRatings = 0,
  size = "md",
  showNumber = true,
  className,
}: RatingDisplayProps) {
  const full = Math.min(5, Math.floor(rating))
  const empty = 5 - full
  const iconClass = sizeClasses[size]

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f-${i}`} className={cn(iconClass, "fill-warning-yellow text-warning-yellow")} />
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e-${i}`} className={cn(iconClass, "text-slate-300")} />
        ))}
      </div>
      {showNumber && (
        <span className="text-sm font-medium">
          {Number(rating).toFixed(1)}
          {totalRatings > 0 && (
            <span className="text-slate-500 font-normal ml-1">({totalRatings})</span>
          )}
        </span>
      )}
    </div>
  )
}
