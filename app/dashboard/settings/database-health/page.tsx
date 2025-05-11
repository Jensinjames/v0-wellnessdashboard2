"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, RefreshCw, Database } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createLogger } from "@/utils/logger"
import { checkDatabaseHealth, fixDatabaseIssues } from "@/utils/db-health-checker"

const logger = createLogger("DatabaseHealthPage")

interface HealthCheckResult {
  isHealthy: boolean
  details: Record<string, any>
}

export default function DatabaseHealthPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isFixing, setIsFixing] = useState(false)
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fixResult, setFixResult] = useState<{ success: boolean; message: string } | null>(null)

  const checkHealth = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setFixResult(null)

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
      setFixResult(null)

      const result = await fixDatabaseIssues()
      setFixResult(result)

      // Re-check health after fixing
      if (result.success) {
        await checkHealth()
      }
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Database Health Check
        </CardTitle>
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

            {fixResult && (
              <Alert variant={fixResult.success ? "default" : "destructive"}>
                <AlertTitle>{fixResult.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{fixResult.message}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              <TabsContent value="summary">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-muted p-2">
                      <div className="text-sm font-medium">Connection</div>
                      <div className="flex items-center">
                        {healthData.details.pingSuccess ? (
                          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="mr-1 h-4 w-4 text-red-500" />
                        )}
                        <span>{healthData.details.pingSuccess ? "Connected" : "Failed"}</span>
                      </div>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <div className="text-sm font-medium">User Changes Log Table</div>
                      <div className="flex items-center">
                        {healthData.details.tableExists ? (
                          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="mr-1 h-4 w-4 text-red-500" />
                        )}
                        <span>{healthData.details.tableExists ? "Exists" : "Missing"}</span>
                      </div>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <div className="text-sm font-medium">Authentication</div>
                      <div className="flex items-center">
                        {healthData.details.userSuccess ? (
                          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="mr-1 h-4 w-4 text-red-500" />
                        )}
                        <span>{healthData.details.userSuccess ? "Working" : "Failed"}</span>
                      </div>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <div className="text-sm font-medium">RLS Policies</div>
                      <div className="flex items-center">
                        {healthData.details.policiesCount > 0 ? (
                          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="mr-1 h-4 w-4 text-red-500" />
                        )}
                        <span>
                          {healthData.details.policiesCount > 0
                            ? `${healthData.details.policiesCount} policies`
                            : "No policies"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="details">
                <div className="rounded-md bg-muted p-4">
                  <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                    {JSON.stringify(healthData.details, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>

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
  )
}
