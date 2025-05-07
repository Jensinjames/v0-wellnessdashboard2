"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { TOKEN_EVENTS } from "@/lib/token-manager"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RotateCw, AlertCircle, CheckCircle, Clock } from "lucide-react"

export function TokenMonitor() {
  const { getTokenStatus, refreshToken, isTokenValid } = useSupabase({ debugMode: true })
  const [status, setStatus] = useState(getTokenStatus())
  const [lastEvent, setLastEvent] = useState<{ type: string; time: string } | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    // Update status every 10 seconds
    const interval = setInterval(() => {
      setStatus(getTokenStatus())
    }, 10000)

    // Listen for token events
    const handleRefreshSuccess = () => {
      setStatus(getTokenStatus())
      setLastEvent({ type: "success", time: new Date().toLocaleTimeString() })
    }

    const handleRefreshFailure = () => {
      setStatus(getTokenStatus())
      setLastEvent({ type: "failure", time: new Date().toLocaleTimeString() })
    }

    const handleRefreshAttempt = () => {
      setStatus(getTokenStatus())
      setLastEvent({ type: "attempt", time: new Date().toLocaleTimeString() })
    }

    // Add event listeners
    window.addEventListener(TOKEN_EVENTS.REFRESH_SUCCESS, handleRefreshSuccess)
    window.addEventListener(TOKEN_EVENTS.REFRESH_FAILURE, handleRefreshFailure)
    window.addEventListener(TOKEN_EVENTS.REFRESH_ATTEMPT, handleRefreshAttempt)

    return () => {
      clearInterval(interval)
      window.removeEventListener(TOKEN_EVENTS.REFRESH_SUCCESS, handleRefreshSuccess)
      window.removeEventListener(TOKEN_EVENTS.REFRESH_FAILURE, handleRefreshFailure)
      window.removeEventListener(TOKEN_EVENTS.REFRESH_ATTEMPT, handleRefreshAttempt)
    }
  }, [getTokenStatus])

  // Format expiry time
  const formatExpiry = () => {
    if (!status.expiresAt) return "Unknown"

    const now = Date.now()
    const expiresAt = status.expiresAt
    const diff = expiresAt - now

    if (diff < 0) return "Expired"

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    return `${minutes}m ${seconds}s`
  }

  // Format last refresh time
  const formatLastRefresh = () => {
    if (!status.lastRefresh) return "Never"

    const now = Date.now()
    const diff = now - status.lastRefresh

    if (diff < 60000) {
      return `${Math.floor(diff / 1000)}s ago`
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`
    } else {
      return new Date(status.lastRefresh).toLocaleTimeString()
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Authentication Token</CardTitle>
          {status.valid ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" /> Valid
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" /> Invalid
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Expires in:</span>
            <span className={`font-medium ${status.expiresSoon ? "text-amber-600" : ""}`}>
              {formatExpiry()}
              {status.expiresSoon && <Clock className="w-3 h-3 inline ml-1 mb-1" />}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last refresh:</span>
            <span className="font-medium">{formatLastRefresh()}</span>
          </div>

          {lastEvent && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last event:</span>
              <span
                className={`font-medium ${
                  lastEvent.type === "success"
                    ? "text-green-600"
                    : lastEvent.type === "failure"
                      ? "text-red-600"
                      : "text-amber-600"
                }`}
              >
                {lastEvent.type} at {lastEvent.time}
              </span>
            </div>
          )}

          {expanded && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Refresh attempts:</span>
                <span className="font-medium">{status.refreshAttempts}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Success rate:</span>
                <span
                  className={`font-medium ${
                    status.successRate > 0.8
                      ? "text-green-600"
                      : status.successRate > 0.5
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {Math.round(status.successRate * 100)}%
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Less details" : "More details"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refreshToken()}
          disabled={!isTokenValid() && status.refreshAttempts > 0}
        >
          <RotateCw className="w-4 h-4 mr-1" /> Refresh Now
        </Button>
      </CardFooter>
    </Card>
  )
}
