"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSupabase } from "@/hooks/use-supabase"
import { TOKEN_EVENTS } from "@/lib/token-manager"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Wifi, WifiOff } from "lucide-react"

export function TokenMonitor() {
  const { toast } = useToast()
  const { refreshToken, getTokenStatus, isOnline, resetAuthState } = useSupabase({ debugMode: true })
  const [status, setStatus] = useState<ReturnType<typeof getTokenStatus>>()
  const [refreshing, setRefreshing] = useState(false)
  const [events, setEvents] = useState<Array<{ type: string; time: Date; message: string }>>([])

  // Format time remaining
  const formatTimeRemaining = useCallback((expiresAt: number | null) => {
    if (!expiresAt) return "Unknown"

    const now = Date.now()
    const diff = expiresAt - now

    if (diff <= 0) return "Expired"

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    return `${minutes}m ${seconds}s`
  }, [])

  // Format date
  const formatDate = useCallback((timestamp: number | null) => {
    if (!timestamp) return "Never"
    return new Date(timestamp).toLocaleTimeString()
  }, [])

  // Update status
  const updateStatus = useCallback(() => {
    const currentStatus = getTokenStatus()
    setStatus(currentStatus)
  }, [getTokenStatus])

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const success = await refreshToken()
      if (success) {
        toast({
          title: "Token refreshed",
          description: "Your authentication token has been refreshed successfully.",
        })
      } else {
        toast({
          title: "Refresh failed",
          description: "Unable to refresh your authentication token.",
          variant: "destructive",
        })
      }
      updateStatus()
    } finally {
      setRefreshing(false)
    }
  }

  // Listen for token events
  useEffect(() => {
    const handleTokenEvent = (event: Event) => {
      const customEvent = event as CustomEvent
      const eventType = event.type
      const now = new Date()

      let message = ""
      switch (eventType) {
        case TOKEN_EVENTS.REFRESH_SUCCESS:
          message = "Token refreshed successfully"
          break
        case TOKEN_EVENTS.REFRESH_FAILURE:
          message = `Refresh failed: ${customEvent.detail?.error?.message || "Unknown error"}`
          break
        case TOKEN_EVENTS.REFRESH_STARTED:
          message = "Token refresh started"
          break
        case TOKEN_EVENTS.SESSION_EXPIRED:
          message = "Session expired"
          break
        default:
          message = `Unknown event: ${eventType}`
      }

      setEvents((prev) => [{ type: eventType, time: now, message }, ...prev].slice(0, 10))
      updateStatus()
    }

    // Add event listeners
    window.addEventListener(TOKEN_EVENTS.REFRESH_SUCCESS, handleTokenEvent)
    window.addEventListener(TOKEN_EVENTS.REFRESH_FAILURE, handleTokenEvent)
    window.addEventListener(TOKEN_EVENTS.REFRESH_STARTED, handleTokenEvent)
    window.addEventListener(TOKEN_EVENTS.SESSION_EXPIRED, handleTokenEvent)

    // Initial status update
    updateStatus()

    // Set up interval to update status
    const interval = setInterval(updateStatus, 1000)

    return () => {
      window.removeEventListener(TOKEN_EVENTS.REFRESH_SUCCESS, handleTokenEvent)
      window.removeEventListener(TOKEN_EVENTS.REFRESH_FAILURE, handleTokenEvent)
      window.removeEventListener(TOKEN_EVENTS.REFRESH_STARTED, handleTokenEvent)
      window.removeEventListener(TOKEN_EVENTS.SESSION_EXPIRED, handleTokenEvent)
      clearInterval(interval)
    }
  }, [updateStatus])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Authentication Token Status</span>
          {isOnline ? (
            <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
              <Wifi className="h-3 w-3" /> Online
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1 bg-red-50">
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Monitor and manage your authentication token</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Token Status</div>
            <div className="flex items-center gap-2">
              {status?.valid ? (
                <Badge className="flex items-center gap-1 bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3" /> Valid
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Invalid
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Expires In</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatTimeRemaining(status?.expiresAt || null)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Refresh History</div>
          <div className="rounded-md border p-2">
            <div className="text-xs text-muted-foreground">
              Last successful refresh: {formatDate(status?.lastRefresh)}
            </div>
            <div className="text-xs text-muted-foreground">
              Success rate: {status?.successRate ? Math.round(status.successRate * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Refresh attempts: {status?.refreshAttempts || 0}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Recent Events</div>
          <div className="max-h-32 overflow-y-auto rounded-md border p-2">
            {events.length === 0 ? (
              <div className="text-xs text-muted-foreground">No events recorded</div>
            ) : (
              events.map((event, i) => (
                <div key={i} className="text-xs">
                  <span className="font-medium">{event.time.toLocaleTimeString()}</span>:{" "}
                  <span className="text-muted-foreground">{event.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetAuthState}>
          Reset Auth State
        </Button>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh Token
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
