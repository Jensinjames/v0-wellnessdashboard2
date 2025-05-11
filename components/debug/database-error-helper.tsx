"use client"

import { useState } from "react"
import { AlertCircle, ChevronDown, ChevronUp, Database, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DatabaseErrorHelper")

interface DatabaseErrorHelperProps {
  errorCode: string
  errorMessage: string
  technicalDetails?: string
  onRetry?: () => void
}

export function DatabaseErrorHelper({ errorCode, errorMessage, technicalDetails, onRetry }: DatabaseErrorHelperProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRetry = async () => {
    if (!onRetry) return

    setIsLoading(true)
    try {
      await onRetry()
    } catch (error) {
      logger.error("Error during retry:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-red-500" />
          Database Configuration Issue
        </CardTitle>
        <CardDescription>Error code: {errorCode}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>

        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Technical Details</h4>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-2">
            <div className="rounded-md bg-slate-100 p-4">
              <h5 className="mb-2 text-sm font-medium">Possible Causes:</h5>
              <ul className="ml-6 list-disc text-sm">
                <li>Missing or incorrect database schema</li>
                <li>Row Level Security (RLS) policy configuration issues</li>
                <li>Database user permission problems</li>
                <li>Supabase configuration errors</li>
              </ul>

              {technicalDetails && (
                <div className="mt-4">
                  <h5 className="mb-2 text-sm font-medium">Error Details:</h5>
                  <pre className="overflow-x-auto rounded bg-slate-200 p-2 text-xs">{technicalDetails}</pre>
                </div>
              )}

              <div className="mt-4">
                <h5 className="mb-2 text-sm font-medium">Recommended Actions:</h5>
                <ul className="ml-6 list-disc text-sm">
                  <li>Contact your system administrator</li>
                  <li>Check Supabase database configuration</li>
                  <li>Verify RLS policies are correctly set up</li>
                  <li>Ensure database migrations have been applied</li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      {onRetry && (
        <CardFooter>
          <Button variant="outline" onClick={handleRetry} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Authentication
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
