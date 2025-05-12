import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import type { DbError } from "@/lib/db/db-utils"

interface DbErrorProps {
  error: DbError | string | null
  className?: string
}

export function DbError({ error, className }: DbErrorProps) {
  if (!error) return null

  const errorMessage = typeof error === "string" ? error : error.message
  const errorCode = typeof error === "string" ? null : error.code

  return (
    <Alert variant="destructive" className={className}>
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {errorMessage}
        {errorCode && <span className="block text-xs opacity-70 mt-1">Code: {errorCode}</span>}
      </AlertDescription>
    </Alert>
  )
}
