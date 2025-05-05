import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface FormErrorSummaryProps {
  errors: Record<string, string[]>
  title?: string
}

export function FormErrorSummary({ errors, title = "There were errors with your submission" }: FormErrorSummaryProps) {
  // Count total errors
  const totalErrors = Object.values(errors).reduce((count, fieldErrors) => count + fieldErrors.length, 0)

  if (totalErrors === 0) return null

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          {Object.entries(errors).map(([field, fieldErrors]) =>
            fieldErrors.map((error, index) => (
              <li key={`${field}-${index}`}>
                <strong>{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")}</strong>: {error}
              </li>
            )),
          )}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
