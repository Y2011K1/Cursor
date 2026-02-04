import { cn } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react"

interface BadgeProps {
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export function SuccessBadge({ children, className, icon }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200",
      className
    )}>
      {icon || <CheckCircle2 className="h-3 w-3" />}
      {children}
    </span>
  )
}

export function WarningBadge({ children, className, icon }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200",
      className
    )}>
      {icon || <AlertTriangle className="h-3 w-3" />}
      {children}
    </span>
  )
}

export function DangerBadge({ children, className, icon }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200",
      className
    )}>
      {icon || <XCircle className="h-3 w-3" />}
      {children}
    </span>
  )
}

export function InfoBadge({ children, className, icon }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200",
      className
    )}>
      {icon || <Info className="h-3 w-3" />}
      {children}
    </span>
  )
}

export function NeutralBadge({ children, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200",
      className
    )}>
      {children}
    </span>
  )
}
