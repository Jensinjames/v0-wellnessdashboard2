"use client"

import { useSync } from "@/hooks/use-sync"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Cloud, CloudOff, RefreshCw, AlertCircle, Check, Clock } from "lucide-react"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"

export function SyncStatus() {
  const { pendingCount, isSyncing, lastSyncTime, syncErrors, syncData, clearErrors } = useSync()
  const [showDetails, setShowDetails] = useState(false)

  const handleSync = async () => {
    await syncData()
  }

  if (syncErrors.length > 0) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sync Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>There was an error syncing your data.</p>
          {showDetails && (
            <div className="mt-2 text-sm bg-destructive/10 p-2 rounded max-h-32 overflow-y-auto">
              {syncErrors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? "Hide Details" : "Show Details"}
            </Button>
            <Button size="sm" variant="outline" onClick={clearErrors}>
              Dismiss
            </Button>
            <Button size="sm" onClick={handleSync}>
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isSyncing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>
              Syncing {pendingCount} {pendingCount === 1 ? "change" : "changes"}...
            </span>
          </>
        ) : (
          <>
            <Clock className="h-4 w-4" />
            <span>
              {pendingCount} {pendingCount === 1 ? "change" : "changes"} pending
            </span>
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={handleSync}>
              Sync Now
            </Button>
          </>
        )}
      </div>
    )
  }

  if (lastSyncTime) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-green-500" />
        <span>All changes synced {formatDistanceToNow(lastSyncTime, { addSuffix: true })}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {navigator.onLine ? (
        <>
          <Cloud className="h-4 w-4" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4" />
          <span>Offline</span>
        </>
      )}
    </div>
  )
}
