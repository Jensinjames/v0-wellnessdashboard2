"use client"

import { AlertTriangle } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface SchemaErrorAuthProps {
  error: string
  technicalDetails?: string
  onBypass: () => void
  isLoading: boolean
  bypassInProgress: boolean
}

export function SchemaErrorAuth({
  error,
  technicalDetails,
  onBypass,
  isLoading,
  bypassInProgress,
}: SchemaErrorAuthProps) {
  return (
    <Alert variant="warning" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Database Configuration Issue</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
      <div className="mt-2">
        <p className="text-xs mt-1">Error code: SCHEMA-001</p>
        {technicalDetails && (
          <details className="mt-2">
            <summary className="text-xs cursor-pointer">Technical Details</summary>
            <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-x-auto">{technicalDetails}</pre>
          </details>
        )}
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onBypass}
            disabled={isLoading || bypassInProgress}
          >
            {bypassInProgress ? "Bypassing..." : "Bypass Schema Check"}
          </Button>
        </div>
      </div>
    </Alert>
  )
}
