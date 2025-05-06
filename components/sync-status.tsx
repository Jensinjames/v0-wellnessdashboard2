"use client"

import { useSync } from "@/hooks/use-sync"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Cloud, CloudOff, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useState, useEffect } from "react"

export function SyncStatus() {
  const { syncData, isSyncing, lastSyncTime, pendingCount } = useSync()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Format the last sync time
  const formattedLastSync = lastSyncTime ? formatDistanceToNow(lastSyncTime, { addSuffix: true }) : "Never"

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Cloud className="h-4 w-4 text-green-500" />
              ) : (
                <CloudOff className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-sm text-muted-foreground">{isOnline ? "Online" : "Offline"}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isOnline ? "Connected to the server" : "Working offline. Changes will sync when you're back online."}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {pendingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700">
                <span>{pendingCount}</span>
                <span className="sr-only">pending changes</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{pendingCount} changes waiting to sync</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => syncData()}
              disabled={isSyncing || !isOnline}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span className="sr-only">Sync now</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isSyncing ? "Syncing..." : isOnline ? `Last synced: ${formattedLastSync}` : "Cannot sync while offline"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
