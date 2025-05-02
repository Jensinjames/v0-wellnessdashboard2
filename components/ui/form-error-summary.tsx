import type { FieldValues, UseFormReturn } from "react-hook-form"

interface FormErrorSummaryProps<T extends FieldValues = FieldValues> {
  errors?: string[]
  form?: UseFormReturn<T>
  title?: string
  className?: string
}

export function FormErrorSummary<T extends FieldValues = FieldValues>({
  errors,
  form,
  title = "Please correct the following errors:",
  className = "",
}: FormErrorSummaryProps<T>) {
  // If direct errors array is provided, use it
  // Otherwise, if form is provided, extract errors from it
  const errorMessages =
    errors ||
    (form && Object.keys(form.formState.errors).length > 0
      ? Object.entries(form.formState.errors).map(
          ([key, error]) => `${key}: ${error?.message?.toString() || "Invalid value"}`,
        )
      : [])

  // If no errors, don't render anything
  if (!errorMessages || errorMessages.length === 0) return null

  return (
    <div
      className={`bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4 ${className}`}
      role="alert"
      aria-labelledby="validation-summary-heading"
    >
      <h4 id="validation-summary-heading" className="font-medium mb-2">
        {title}
      </h4>
      <ul className="list-disc pl-5 space-y-1">
        {errorMessages.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  )
}
