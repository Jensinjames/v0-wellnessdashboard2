"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { checkAuthServiceStatus, shouldShowServiceWarning, type AuthServiceStatus } from "@/utils/auth-service-status"

export function AuthServiceStatus() {
  const [status, setStatus] = useState<AuthServiceStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [showStatus, setShowStatus] = useState(false)

  // Check the service status on mount
  useEffect(() => {
    const checkStatus = async () => {
      // Only check if we should show a warning
      if (shouldShowServiceWarning()) {
        setShowStatus(true)
        refreshStatus()
      }
    }

    checkStatus()
  }, [])

  // Function to refresh the status
  const refreshStatus = async () => {
    try {
      setIsChecking(true)
      const result = await checkAuthServiceStatus(true)
      setStatus(result)
      setShowStatus(!result.available)
    } catch (error) {
      console.error("Error checking auth service status:", error)
    } finally {
      setIsChecking(false)
    }
  }

  // If we don't need to show the status, return null
  if (!showStatus) {
    return null
  }

  return (
    <Alert variant={status?.available ? "default" : "destructive"} className="mb-4">
      <div className="flex items-start">
        <div className="mr-2 mt-0.5">
          {status?.available ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          <AlertTitle>
            {status?.available ? "Authentication Service Available" : "Authentication Service Issues"}
          </AlertTitle>
          <AlertDescription>
            {status?.available
              ? `The authentication service is responding normally (${status.latency}ms).`
              : "We're experiencing some issues with our authentication service. Please try again in a few moments."}
          </AlertDescription>
        </div>
        <Button variant="outline" size="sm" className="ml-2 h-8 px-2" onClick={refreshStatus} disabled={isChecking}>
          <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh Status</span>
        </Button>
      </div>
    </Alert>
  )
}
