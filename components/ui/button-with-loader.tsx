import { Button, ButtonProps } from "./button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ButtonWithLoaderProps extends ButtonProps {
  isLoading?: boolean
}

export function ButtonWithLoader({ 
  children, 
  isLoading,
  className,
  disabled,
  ...props 
}: ButtonWithLoaderProps) {
  return (
    <Button 
      disabled={disabled || isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
    </Button>
  )
}
