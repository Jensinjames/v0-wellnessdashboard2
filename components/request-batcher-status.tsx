"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
// Import the named export
import { useBatchedSupabase } from "@/hooks/use-batched-supabase"
import { RefreshCw, XCircle, Wifi, WifiOff, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function RequestBatcherStatus() {
  const { batcherStatus, status, clearQueue, checkNetwork } = useBatchedSupabase()
  const [eventLog, setEventLog] = useState<Array<{ type: string; message: string; timestamp: number }>>([])
  const [showLog, setShowLog] = useState(false)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false)
  const [lastNetworkCheck, setLastNetworkCheck] = useState<number | null>(null)

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
      case "network-error":
        return "Network error detected, connection lost"
      default:
        return `Status: ${status}`
    }
  }

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  // Handle manual network check
  const handleCheckNetwork = async () => {
    setIsCheckingNetwork(true)
    setEventLog((prev) => [
      {
        type: "info",
        message: "Manual network check initiated",
        timestamp: Date.now(),
      },
      ...prev.slice(0, 19),
    ])

    try {
      const isConnected = await checkNetwork()

      setEventLog((prev) => [
        {
          type: isConnected ? "success" : "error",
          message: isConnected
            ? "Network check successful, connection restored"
            : "Network check failed, still disconnected",
          timestamp: Date.now(),
        },
        ...prev.slice(0, 19),
      ])

      setLastNetworkCheck(Date.now())
    } catch (error) {
      setEventLog((prev) => [
        {
          type: "error",
          message: "Network check failed with error",
          timestamp: Date.now(),
        },
        ...prev.slice(0, 19),
      ])
    } finally {
      setIsCheckingNetwork(false)
    }
  }

  // Handle page reload
  const handleReload = () => {
    window.location.reload()
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
              <p className="mb-2">Unable to connect to the server. This could be due to:</p>
              <ul className="list-disc pl-5 mb-2 text-sm">
                <li>Your internet connection is offline</li>
                <li>The server is temporarily unavailable</li>
                <li>A firewall or network restriction is blocking access</li>
                <li>CORS policy issues with the API endpoint</li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckNetwork}
                  disabled={isCheckingNetwork}
                  className="bg-white/10"
                >
                  {isCheckingNetwork ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Checking...
                    </>
                  ) : (
                    <>
                      <Wifi className="mr-2 h-4 w-4" /> Check Connection
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleReload} className="bg-white/10">
                  <RefreshCw className="mr-2 h-4 w-4" /> Reload Page
                </Button>
              </div>
              {lastNetworkCheck && <p className="text-xs mt-2">Last check: {formatTime(lastNetworkCheck)}</p>}
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

        {!batcherStatus.networkError && !batcherStatus.rateLimited && navigator.onLine === false && (
          <Alert className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Browser Offline</AlertTitle>
            <AlertDescription>
              Your browser reports that you're offline. Some features may be limited.
              <Button variant="outline" size="sm" onClick={handleCheckNetwork} className="mt-2 bg-amber-100">
                <Wifi className="mr-2 h-4 w-4" /> Check Connection
              </Button>
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
          {navigator.onLine ? (
            <p className="text-green-600 mt-1">Browser reports: Online</p>
          ) : (
            <p className="text-red-600 mt-1">Browser reports: Offline</p>
          )}
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
    case "network-error":
      return "text-red-600"
    case "info":
      return "text-blue-600"
    default:
      return "text-gray-600"
  }
}
