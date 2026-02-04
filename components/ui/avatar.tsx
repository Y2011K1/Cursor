import Image from "next/image"
import { cn } from "@/lib/utils"

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  return (
    <div className={cn(
      "relative rounded-full overflow-hidden bg-deep-teal flex items-center justify-center text-white font-semibold flex-shrink-0",
      sizeClasses[size],
      className
    )}>
      {src ? (
        <Image 
          src={src} 
          alt={name}
          fill
          className="object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
