"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useEffect, useRef } from "react"

interface FormErrorSummaryProps {
  errors: Record<string, string | string[]>
  title?: string
  autoFocus?: boolean
  id?: string
}

export function FormErrorSummary({
  errors,
  title = "There were errors with your submission",
  autoFocus = true,
  id = "form-error-summary",
}: FormErrorSummaryProps) {
  const errorRef = useRef<HTMLDivElement>(null)

  // Process errors to handle both string and string[] formats
  const processedErrors: Record<string, string[]> = Object.entries(errors).reduce(
    (acc, [field, error]) => {
      acc[field] = Array.isArray(error) ? error : [error as string]
      return acc
    },
    {} as Record<string, string[]>,
  )

  // Count total errors
  const totalErrors = Object.values(processedErrors).reduce((count, fieldErrors) => count + fieldErrors.length, 0)

  // Auto-focus the error summary when it appears
  useEffect(() => {
    if (autoFocus && errorRef.current && totalErrors > 0) {
      errorRef.current.focus()
    }
  }, [totalErrors, autoFocus])

  if (totalErrors === 0) return null

  // Format field name for better readability
  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .replace(/([a-z])(\d)/, "$1 $2") // Add space between letters and numbers
      .replace(/([a-z])_([a-z])/g, "$1 $2") // Replace underscores with spaces
  }

  return (
    <Alert
      variant="destructive"
      ref={errorRef}
      tabIndex={-1}
      id={id}
      role="alert"
      aria-labelledby={`${id}-title`}
      className="mb-6"
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle id={`${id}-title`} className="sr-only md:not-sr-only">
        {title} ({totalErrors} {totalErrors === 1 ? "error" : "errors"})
      </AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          {Object.entries(processedErrors).map(([field, fieldErrors]) =>
            fieldErrors.map((error, index) => (
              <li key={`${field}-${index}`} id={`error-${field}-${index}`}>
                <span className="font-medium">{formatFieldName(field)}</span>: {error}
              </li>
            )),
          )}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
