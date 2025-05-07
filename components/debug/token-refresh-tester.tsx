"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertTriangle, Clock, Shield, ShieldAlert } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TokenRefreshTester() {
  const { toast } = useToast()
  const { refreshToken, getTokenStatus, isOnline, isTokenValid, resetAuthState } = useSupabase({ debugMode: true })

  const [status, setStatus] = useState<ReturnType<typeof getTokenStatus>>()
  const [refreshing, setRefreshing] = useState(false)
  const [events, setEvents] = useState<Array<{ type: string; time: Date; message: string }>>([])
  const [countdown, setCountdown] = useState<number | null>(null)

  // Format time remaining
  const formatTimeRemaining = (expiresAt: number | null) => {
    if (!expiresAt) return "Unknown"

    const now = Date.now()
    const diff = expiresAt - now

    if (diff <= 0) return "Expired"

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    return `${minutes}m ${seconds}s`
  }

  // Format date
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "Never"
    return new Date(timestamp).toLocaleTimeString()
  }

  // Update status
  const updateStatus = () => {
    const currentStatus = getTokenStatus()
    setStatus(currentStatus)

    // Update countdown if token is valid
    if (currentStatus.expiresAt) {
      setCountdown(Math.max(0, currentStatus.expiresAt - Date.now()))
    } else {
      setCountdown(null)
    }
  }

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    addEvent("manual", "Manual token refresh initiated")

    try {
      const success = await refreshToken()

      if (success) {
        toast({
          title: "Token refreshed",
          description: "Your authentication token has been refreshed successfully.",
        })
        addEvent("success", "Token refreshed successfully")
      } else {
        toast({
          title: "Refresh failed",
          description: "Unable to refresh your authentication token.",
          variant: "destructive",
        })
        addEvent("error", "Token refresh failed")
      }

      updateStatus()
    } catch (error) {
      addEvent("error", `Error refreshing token: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setRefreshing(false)
    }
  }

  // Add event to history
  const addEvent = (type: string, message: string) => {
    setEvents((prev) =>
      [
        {
          type,
          time: new Date(),
          message,
        },
        ...prev,
      ].slice(0, 10),
    )
  }

  // Reset auth state
  const handleReset = () => {
    resetAuthState()
    addEvent("reset", "Auth state reset")
    updateStatus()
    toast({
      title: "Auth state reset",
      description: "The authentication state has been reset.",
    })
  }

  // Force token expiration (for testing)
  const simulateExpiredToken = () => {
    // This is just a simulation - it doesn't actually expire the token
    // but it helps test the UI for expired tokens
    addEvent("simulate", "Simulating expired token")
    setStatus((prev) =>
      prev
        ? {
            ...prev,
            valid: false,
            expiresAt: Date.now() - 1000,
            expiresSoon: true,
          }
        : prev,
    )

    toast({
      title: "Token expiration simulated",
      description: "This is just a UI simulation. Your actual token is unchanged.",
      variant: "warning",
    })
  }

  // Initialize and set up interval to update status
  useEffect(() => {
    updateStatus()

    // Update status and countdown every second
    const interval = setInterval(() => {
      updateStatus()
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Token Refresh Tester</span>
          {isOnline ? (
            <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-800">
              Online
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-800">
              Offline
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Test and monitor authentication token refresh functionality</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Token Status</div>
            <div className="flex items-center gap-2">
              {status?.valid ? (
                <Badge className="flex items-center gap-1 bg-green-100 text-green-800">
                  <Shield className="h-3 w-3" /> Valid
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> Invalid
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
                <div key={i} className="text-xs mb-1">
                  <span className="font-medium">{event.time.toLocaleTimeString()}</span>:{" "}
                  <span
                    className={`${
                      event.type === "error"
                        ? "text-red-600"
                        : event.type === "success"
                          ? "text-green-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {event.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleReset} size="sm">
          Reset Auth State
        </Button>
        <Button onClick={handleRefresh} disabled={refreshing} size="sm">
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
        <Button variant="outline" onClick={simulateExpiredToken} size="sm">
          <AlertTriangle className="mr-2 h-4 w-4" /> Simulate Expired
        </Button>
      </CardFooter>
    </Card>
  )
}
