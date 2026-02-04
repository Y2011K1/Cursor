import { cn } from "@/lib/utils"

interface ContentWrapperProps {
  children: React.ReactNode
  size?: 'narrow' | 'default' | 'wide' | 'full'
  className?: string
}

const sizeClasses = {
  narrow: 'max-w-4xl',    // Forms, settings
  default: 'max-w-6xl',   // Most content
  wide: 'max-w-7xl',      // Dashboards
  full: 'max-w-none'      // Tables, full-width
}

export function ContentWrapper({ 
  children, 
  size = 'default',
  className
}: ContentWrapperProps) {
  return (
    <div className={cn(
      sizeClasses[size],
      'mx-auto px-4 sm:px-6 lg:px-8',
      className
    )}>
      {children}
    </div>
  )
}
