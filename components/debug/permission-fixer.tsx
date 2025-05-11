"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react"

interface PermissionStatus {
  success: boolean
  missingPermissions: string[]
  details: Record<string, any>
  message?: string
}

export function PermissionFixer() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<PermissionStatus | null>(null)
  const [fixResult, setFixResult] = useState<any | null>(null)

  const checkPermissions = async () => {
    try {
      setChecking(true)
      setStatus(null)

      const response = await fetch("/api/admin/check-permissions")
      const data = await response.json()

      setStatus(data)
    } catch (error) {
      console.error("Error checking permissions:", error)
      setStatus({
        success: false,
        missingPermissions: ["Error checking permissions"],
        details: { error: String(error) },
      })
    } finally {
      setChecking(false)
    }
  }

  const fixPermissions = async () => {
    try {
      setLoading(true)
      setFixResult(null)

      const response = await fetch("/api/admin/fix-permissions", {
        method: "POST",
      })

      const data = await response.json()
      setFixResult(data)

      // Check permissions again after fixing
      await checkPermissions()
    } catch (error) {
      console.error("Error fixing permissions:", error)
      setFixResult({
        success: false,
        error: String(error),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Database Permission Diagnostics</CardTitle>
        <CardDescription>Diagnose and fix database permission issues (DB-GRANT-001)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status && (
          <Alert variant={status.success ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
              {status.success ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              <AlertTitle>
                {status.success ? "Permissions are correctly configured" : "Permission issues detected"}
              </AlertTitle>
            </div>
            <AlertDescription>
              {status.success ? (
                <p className="mt-2">All database permissions are properly set up.</p>
              ) : (
                <div className="mt-2">
                  <p className="font-medium">Missing permissions:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {status.missingPermissions.map((perm, i) => (
                      <li key={i}>{perm}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {fixResult && (
          <Alert variant={fixResult.success ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
              {fixResult.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <AlertTitle>{fixResult.success ? "Permission fixes applied" : "Error fixing permissions"}</AlertTitle>
            </div>
            <AlertDescription>
              {fixResult.success ? (
                <p className="mt-2">{fixResult.message || "Database permissions have been updated successfully."}</p>
              ) : (
                <p className="mt-2">{fixResult.error || "An error occurred while fixing permissions."}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkPermissions} disabled={checking}>
          {checking ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Permissions"
          )}
        </Button>
        <Button onClick={fixPermissions} disabled={loading || status?.success === true}>
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Fixing...
            </>
          ) : (
            "Fix Permissions"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
