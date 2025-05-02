import type React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  htmlFor: string
  description?: string
  error?: string
  required?: boolean
}

export function FormField({
  label,
  htmlFor,
  description,
  error,
  required = false,
  className,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("grid gap-2", className)} {...props}>
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {error && (
          <div className="flex items-center text-destructive text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </div>
        )}
      </div>
      {children}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}
