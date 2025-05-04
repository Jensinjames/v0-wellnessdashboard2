import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

interface AuthSuccessProps {
  title?: string
  message: string
}

export function AuthSuccess({ title = "Success", message }: AuthSuccessProps) {
  return (
    <Alert variant="default" className="mb-4 border-green-500 bg-green-50 dark:bg-green-900/20">
      <CheckCircle className="h-4 w-4 text-green-500" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
