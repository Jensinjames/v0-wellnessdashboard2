import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

interface FieldErrorProps {
  id?: string
  error?: string | string[] | null
  className?: string
}

export function FieldError({ id, error, className }: FieldErrorProps) {
  if (!error) return null

  const errorMessage = Array.isArray(error) ? error[0] : error

  return (
    <div
      id={id}
      aria-live="polite"
      className={cn("flex items-center gap-x-1 text-sm font-medium text-destructive mt-1", className)}
    >
      <ExclamationTriangleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{errorMessage}</span>
    </div>
  )
}
