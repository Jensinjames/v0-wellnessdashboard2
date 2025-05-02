import type React from "react"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const formStatusVariants = cva("flex items-center gap-2 rounded-md p-3 text-sm transition-all", {
  variants: {
    variant: {
      loading: "bg-blue-50 text-blue-700 border border-blue-200",
      success: "bg-green-50 text-green-700 border border-green-200",
      error: "bg-red-50 text-red-700 border border-red-200",
    },
  },
  defaultVariants: {
    variant: "loading",
  },
})

export interface FormStatusProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof formStatusVariants> {
  message: string
  isVisible?: boolean
}

export function FormStatus({ className, variant, message, isVisible = true, ...props }: FormStatusProps) {
  if (!isVisible) return null

  return (
    <div
      className={cn(formStatusVariants({ variant }), "animate-in fade-in slide-in-from-top-1", className)}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      {...props}
    >
      {variant === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
      {variant === "success" && <CheckCircle className="h-4 w-4" />}
      {variant === "error" && <AlertCircle className="h-4 w-4" />}
      <span>{message}</span>
    </div>
  )
}
