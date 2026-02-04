import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card"
import { cn } from "@/lib/utils"

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function PrimaryCard({ children, className }: CardProps) {
  return (
    <Card className={cn(
      "border-2 border-deep-teal shadow-xl bg-white",
      className
    )}>
      {children}
    </Card>
  )
}

export function SecondaryCard({ children, className }: CardProps) {
  return (
    <Card className={cn(
      "border-0 shadow-md bg-white hover:shadow-lg transition-shadow cursor-pointer",
      className
    )}>
      {children}
    </Card>
  )
}

export function AccentCard({ children, className }: CardProps) {
  return (
    <Card className={cn(
      "border-0 shadow-md bg-gradient-to-br from-light-sky to-white",
      className
    )}>
      {children}
    </Card>
  )
}

// Re-export Card components for convenience
export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
