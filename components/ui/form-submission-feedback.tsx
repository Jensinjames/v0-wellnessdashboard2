"use client"

import { cn } from "@/lib/utils"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { useEffect, useRef } from "react"

interface FormSubmissionFeedbackProps {
  status: "success" | "error" | null
  message?: string
  title?: string
  autoFocus?: boolean
  id?: string
}

export function FormSubmissionFeedback({
  status,
  message,
  title,
  autoFocus = true,
  id = "form-submission-feedback",
}: FormSubmissionFeedbackProps) {
  const feedbackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus && feedbackRef.current && status) {
      feedbackRef.current.focus()
    }
  }, [status, autoFocus])

  if (!status) return null

  const isSuccess = status === "success"
  const defaultTitle = isSuccess ? "Success" : "Error"
  const defaultMessage = isSuccess
    ? "Your form has been submitted successfully."
    : "There was a problem submitting your form. Please try again."

  return (
    <Alert
      variant={isSuccess ? "default" : "destructive"}
      ref={feedbackRef}
      tabIndex={-1}
      id={id}
      role="alert"
      aria-labelledby={`${id}-title`}
      className={cn("mb-6", isSuccess ? "border-green-500 text-green-700 dark:text-green-300" : "")}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      ) : (
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
      )}
      <AlertTitle id={`${id}-title`}>{title || defaultTitle}</AlertTitle>
      <AlertDescription>{message || defaultMessage}</AlertDescription>
    </Alert>
  )
}
