import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface FormErrorSummaryProps {
  title?: string
  description: string
  className?: string
}

export function FormErrorSummary({ title = "Error", description, className = "" }: FormErrorSummaryProps) {
  return (
    <Alert variant="destructive" className={`mb-4 ${className}`} role="alert" aria-live="assertive">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle className="sr-only">{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}
