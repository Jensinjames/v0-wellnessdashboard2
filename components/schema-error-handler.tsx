"use client"

/**
 * Schema Error Handler Component
 * Provides a UI for handling schema errors
 */
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fixSchemaIssue } from "@/utils/schema-utils"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SchemaErrorHandler")

interface SchemaErrorHandlerProps {
  error: string
  onRetry: () => void
  onBypass: () => void
}

export function SchemaErrorHandler({ error, onRetry, onBypass }: SchemaErrorHandlerProps) {
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFixSchema = async () => {
    setIsFixing(true)
    setFixResult(null)

    try {
      logger.info("Attempting to fix schema")
      const result = await fixSchemaIssue()

      if (result.success) {
        setFixResult({ success: true, message: "Schema fixed successfully. You can now retry." })
      } else {
        setFixResult({
          success: false,
          message: `Failed to fix schema: ${result.error || "Unknown error"}`,
        })
      }
    } catch (error) {
      logger.error("Error fixing schema:", error)
      setFixResult({
        success: false,
        message: `Error fixing schema: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Database Schema Issue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Error Code: SCHEMA-001</AlertTitle>
          <AlertDescription className="mt-2">
            There is a database configuration issue. The application is missing required tables.
          </AlertDescription>
        </Alert>

        <div className="text-sm text-gray-500">
          <p>Technical details:</p>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">{error}</pre>
        </div>

        {fixResult && (
          <Alert variant={fixResult.success ? "default" : "destructive"}>
            <AlertTitle>{fixResult.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{fixResult.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBypass}>
          Continue Anyway
        </Button>
        <div className="space-x-2">
          <Button variant="default" onClick={handleFixSchema} disabled={isFixing}>
            {isFixing ? "Fixing..." : "Fix Schema"}
          </Button>
          <Button variant="secondary" onClick={onRetry} disabled={isFixing}>
            Retry
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
