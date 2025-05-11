"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { checkDatabaseHealth } from "@/utils/db-health-checker"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DatabaseHealthPage")

export default function DatabaseHealthPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isFixing, setIsFixing] = useState(false)
  const [healthData, setHealthData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await checkDatabaseHealth()
      setHealthData(result)
    } catch (err) {
      logger.error("Error checking database health:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const fixPermissions = async () => {
    try {
      setIsFixing(true)
      setError(null)

      const response = await fetch("/api/auth/fix-database-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fix permissions")
      }

      // Re-check health after fixing
      await checkHealth()
    } catch (err) {
      logger.error("Error fixing permissions:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsFixing(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Health Check</CardTitle>
          <CardDescription>Check the health of your database connection and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Checking database health...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : healthData ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="mr-2">
                  {healthData.isHealthy ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium">
                    {healthData.isHealthy ? "Database is healthy" : "Database health issues detected"}
                  </h3>
                </div>
              </div>

              <div className="rounded-md bg-muted p-4">
                <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(healthData.details, null, 2)}</pre>
              </div>

              {!healthData.isHealthy && (
                <Alert>
                  <AlertTitle>Issues Detected</AlertTitle>
                  <AlertDescription>
                    Database health issues were detected. Click the "Fix Permissions" button to attempt to resolve them.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={checkHealth} disabled={isLoading || isFixing}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <Button onClick={fixPermissions} disabled={isLoading || isFixing || (healthData && healthData.isHealthy)}>
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing Permissions...
              </>
            ) : (
              "Fix Permissions"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
