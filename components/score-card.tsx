"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ScoreCardProps {
  score: number
  totalPoints: number
  percentage: number
  status?: "pass" | "fail"
  attemptNumber?: number
  dateTaken?: string
  title?: string
  className?: string
}

export function ScoreCard({
  score,
  totalPoints,
  percentage,
  status,
  attemptNumber,
  dateTaken,
  title,
  className,
}: ScoreCardProps) {
  const colorClass =
    percentage >= 80
      ? "text-success-green"
      : percentage >= 60
        ? "text-warning-yellow"
        : "text-warm-coral"

  return (
    <Card className={cn("border-0 shadow-md", className)}>
      <CardContent className="p-4">
        {title && (
          <p className="text-sm font-medium text-slate-blue mb-2">{title}</p>
        )}
        <div className="flex items-baseline gap-2">
          <span className={cn("text-3xl font-bold", colorClass)}>
            {percentage.toFixed(0)}%
          </span>
          <span className="text-slate-500">
            {score}/{totalPoints}
          </span>
        </div>
        {status && (
          <span
            className={cn(
              "inline-block mt-2 rounded-full px-2 py-0.5 text-xs font-medium",
              status === "pass"
                ? "bg-success-green/20 text-success-green"
                : "bg-warm-coral/20 text-warm-coral"
            )}
          >
            {status === "pass" ? "Pass" : "Fail"}
          </span>
        )}
        {attemptNumber != null && (
          <p className="text-xs text-slate-500 mt-1">Attempt #{attemptNumber}</p>
        )}
        {dateTaken && (
          <p className="text-xs text-slate-500">
            {new Date(dateTaken).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
