"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
// Import the named export
import { useBatchedSupabase } from "@/hooks/use-batched-supabase"
import { RefreshCw, XCircle, Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function RequestBatcherStatus() {
  const { batcherStatus, status, clearQueue } = useBatchedSupabase()
  const [eventLog, setEventLog] = useState<Array<{ type: string; message: string; timestamp: number }>>([])
  const [showLog, setShowLog] = useState(false)

  // Add status changes to event log
  useEffect(() => {
    const timestamp = Date.now()

    // Only log status changes
    if (status === "idle") return

    setEventLog((prev) => [
      {
        type: status,
        message: getStatusMessage(status),
        timestamp,
      },
      ...prev.slice(0, 19), // Keep only the last 20 events
    ])
  }, [status])

  // Helper to generate status messages
  const getStatusMessage = (status: string): string => {
    switch (status) {
      case "pending":
        return "Request added to batch queue"
      case "success":
        return "Batch processed successfully"
      case "error":
        return "Error processing batch"
      case "rate-limited":
        return "Rate limit detected, pausing requests for 60 seconds"
      default:
        return `Status: ${status}`
    }
  }

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Request Batcher Status</CardTitle>
          <div className="flex items-center gap-2">
            {batcherStatus.networkError && (
              <Badge variant="destructive" className="animate-pulse">
                Offline
              </Badge>
            )}
            {batcherStatus.rateLimited && (
              <Badge variant="destructive" className={batcherStatus.rateLimited ? "animate-pulse" : ""}>
                Rate Limited
              </Badge>
            )}
            <Badge variant={batcherStatus.processing ? "secondary" : "outline"}>
              {batcherStatus.processing ? "Processing" : "Idle"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {batcherStatus.networkError && (
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Network Error</AlertTitle>
            <AlertDescription>
              Unable to connect to the server. Check your internet connection.
              <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                <Wifi className="mr-2 h-4 w-4" /> Reconnect
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {batcherStatus.rateLimited && (
          <Alert className="bg-red-50 text-red-800 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Rate Limiting Detected</AlertTitle>
            <AlertDescription>
              The system has detected rate limiting. Requests are paused for 60 seconds to prevent further issues.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>Queue Length</span>
            <span className="font-medium">{batcherStatus.queueLength} requests</span>
          </div>
          <Progress
            value={Math.min(batcherStatus.queueLength * 10, 100)}
            className="h-2"
            indicatorColor={batcherStatus.queueLength > 5 ? "#f59e0b" : "#10b981"}
          />
        </div>

        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearQueue}
            disabled={batcherStatus.queueLength === 0}
            className="flex items-center gap-1"
          >
            <XCircle className="h-4 w-4" />
            Clear Queue
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowLog(!showLog)} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            {showLog ? "Hide Log" : "Show Log"}
          </Button>
        </div>

        {showLog && eventLog.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto rounded border p-2 text-xs">
            {eventLog.map((event, index) => (
              <div key={index} className="mb-1 flex items-start gap-2">
                <span className="text-muted-foreground">{formatTime(event.timestamp)}</span>
                <span className={`font-medium ${getEventTypeColor(event.type)}`}>{event.message}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>Request batching helps reduce API calls and prevent rate limiting.</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper to get color for event type
function getEventTypeColor(type: string): string {
  switch (type) {
    case "pending":
      return "text-blue-600"
    case "success":
      return "text-green-600"
    case "error":
      return "text-red-600"
    case "rate-limited":
      return "text-amber-600"
    default:
      return "text-gray-600"
  }
}
