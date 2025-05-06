"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CloudOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWellness } from "@/context/wellness-context"

export function OfflineStatus() {
  const { isOffline, refreshData } = useWellness()
  const [showAlert, setShowAlert] = useState(false)

  // Show alert when offline status changes
  useEffect(() => {
    if (isOffline) {
      setShowAlert(true)
    }
  }, [isOffline])

  // Don't render anything if we're online or alert is dismissed
  if (!isOffline || !showAlert) {
    return null
  }

  return (
    <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200">
      <CloudOff className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Offline Mode</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mb-2">
          You're currently working offline. Your changes will be saved locally and synced when you reconnect.
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 hover:bg-amber-100"
            onClick={() => refreshData()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Try to reconnect
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-amber-700 hover:bg-amber-100"
            onClick={() => setShowAlert(false)}
          >
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
