"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Database, Shield, RefreshCw } from "lucide-react"
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client"

const logger = createLogger("AuthDatabaseFixer")

export function AuthDatabaseFixer() {
  const [isChecking, setIsChecking] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [checkResults, setCheckResults] = useState<any>(null)
  const [fixResults, setFixResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Check database permissions
  const checkPermissions = async () => {
    setIsChecking(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()

      // First try the check_auth_permissions function if it exists
      const { data: funcData, error: funcError } = await supabase.rpc("check_auth_permissions")

      if (!funcError && funcData) {
        setCheckResults(funcData)
        return
      }

      // If the function doesn't exist, do manual checks
      const { data: profilesData, error: profilesError } = await supabase.from("profiles").select("count").limit(1)

      const { data: healthCheckData, error: healthCheckError } = await supabase
        .from("health_check")
        .select("count")
        .limit(1)
        .catch(() => ({ data: null, error: { message: "Table doesn't exist" } }))

      setCheckResults({
        timestamp: new Date().toISOString(),
        profiles_accessible: !profilesError,
        health_check_accessible: !healthCheckError,
        profiles_error: profilesError?.message || null,
        health_check_error: healthCheckError?.message || null,
      })
    } catch (err: any) {
      logger.error("Error checking permissions:", err)
      setError(`Error checking permissions: ${err.message || "Unknown error"}`)
    } finally {
      setIsChecking(false)
    }
  }

  // Fix database permissions
  const fixPermissions = async () => {
    setIsFixing(true)
    setError(null)

    try {
      // Call the API endpoint to run the SQL script
      const response = await fetch("/api/admin/fix-auth-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fix permissions")
      }

      setFixResults(result)

      // Re-check permissions after fixing
      await checkPermissions()
    } catch (err: any) {
      logger.error("Error fixing permissions:", err)
      setError(`Error fixing permissions: ${err.message || "Unknown error"}`)
    } finally {
      setIsFixing(false)
    }
  }

  // Check permissions on mount
  useEffect(() => {
    checkPermissions()
  }, [])

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Authentication Database Diagnostics
        </CardTitle>
        <CardDescription>Diagnose and fix database permission issues related to authentication</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {checkResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Diagnostic Results</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Profiles Table Access</span>
                </div>
                {checkResults.profiles_accessible || checkResults.profiles_table_exists ? (
                  <Badge variant="success" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Working
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" /> Failed
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>Health Check Table</span>
                </div>
                {checkResults.health_check_accessible || checkResults.health_check_table_exists ? (
                  <Badge variant="success" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Working
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" /> Missing
                  </Badge>
                )}
              </div>

              {checkResults.profiles_has_rls !== undefined && (
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Row Level Security</span>
                  </div>
                  {checkResults.profiles_has_rls ? (
                    <Badge variant="success" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Enabled
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Disabled
                    </Badge>
                  )}
                </div>
              )}

              {checkResults.auth_schema_exists !== undefined && (
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Auth Schema</span>
                  </div>
                  {checkResults.auth_schema_exists ? (
                    <Badge variant="success" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Exists
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" /> Missing
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {(checkResults.profiles_error || checkResults.health_check_error) && (
              <Alert>
                <AlertTitle>Diagnostic Details</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    {checkResults.profiles_error && (
                      <div>
                        <strong>Profiles Error:</strong> {checkResults.profiles_error}
                      </div>
                    )}
                    {checkResults.health_check_error && (
                      <div>
                        <strong>Health Check Error:</strong> {checkResults.health_check_error}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {fixResults && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Fix Applied</AlertTitle>
            <AlertDescription className="text-green-700">
              Database permission fixes have been applied successfully.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkPermissions} disabled={isChecking || isFixing}>
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-check Permissions
            </>
          )}
        </Button>

        <Button onClick={fixPermissions} disabled={isChecking || isFixing}>
          {isFixing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Applying Fixes...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Fix Permissions
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
