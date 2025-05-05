import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormSubmissionFeedbackProps {
  isSubmitting: boolean
  isSuccess?: boolean
  message?: string
  className?: string
}

export function FormSubmissionFeedback({ isSubmitting, isSuccess, message, className }: FormSubmissionFeedbackProps) {
  if (!isSubmitting && !message) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-center p-3 rounded-md",
        isSubmitting ? "bg-blue-50 text-blue-700" : isSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
        className,
      )}
      role={isSubmitting ? "status" : "alert"}
    >
      {isSubmitting ? (
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      ) : isSuccess ? (
        <CheckCircle className="h-5 w-5 mr-2" />
      ) : (
        <AlertCircle className="h-5 w-5 mr-2" />
      )}
      <span>{isSubmitting ? "Submitting..." : message}</span>
    </div>
  )
}
