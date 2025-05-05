import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface FormErrorSummaryProps {
  errors: Record<string, string>
  title?: string
}

export function FormErrorSummary({ errors, title = "Please correct the following errors:" }: FormErrorSummaryProps) {
  const errorCount = Object.keys(errors).length

  if (errorCount === 0) return null

  return (
    <Alert variant="destructive" role="alert">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          {Object.entries(errors).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
