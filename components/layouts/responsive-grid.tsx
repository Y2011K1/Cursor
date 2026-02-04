import { cn } from "@/lib/utils"

interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: { sm?: number; md?: number; lg?: number; xl?: number }
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8'
}

export function ResponsiveGrid({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  className
}: ResponsiveGridProps) {
  return (
    <div className={cn(
      'grid',
      `grid-cols-${cols.sm || 1}`,
      cols.md && `sm:grid-cols-${cols.md}`,
      cols.lg && `lg:grid-cols-${cols.lg}`,
      cols.xl && `xl:grid-cols-${cols.xl}`,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}
