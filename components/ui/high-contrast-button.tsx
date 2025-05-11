import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

const highContrastButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-700 text-white hover:bg-blue-800", // Higher contrast than primary
        destructive: "bg-red-700 text-white hover:bg-red-800", // Higher contrast than destructive
        outline: "border-2 border-gray-700 bg-background text-gray-900 hover:bg-gray-100 hover:text-gray-900",
        secondary: "bg-gray-700 text-white hover:bg-gray-800", // Higher contrast than secondary
        ghost: "text-gray-900 hover:bg-gray-100 hover:text-gray-900",
        link: "text-blue-700 underline-offset-4 hover:underline", // Higher contrast than link
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface HighContrastButtonProps extends ButtonProps, VariantProps<typeof highContrastButtonVariants> {}

const HighContrastButton = React.forwardRef<HTMLButtonElement, HighContrastButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <Button className={cn(highContrastButtonVariants({ variant, size, className }))} ref={ref} {...props}>
        {children}
      </Button>
    )
  },
)
HighContrastButton.displayName = "HighContrastButton"

export { HighContrastButton, highContrastButtonVariants }
