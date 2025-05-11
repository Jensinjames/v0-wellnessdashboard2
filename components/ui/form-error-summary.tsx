interface FormErrorSummaryProps {
  errors: string[]
  title?: string
  className?: string
}

export function FormErrorSummary({
  errors,
  title = "Please correct the following errors:",
  className = "",
}: FormErrorSummaryProps) {
  if (errors.length === 0) return null

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
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  )
}
