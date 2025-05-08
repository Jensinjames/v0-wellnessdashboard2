"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getConnectionHealth, checkSupabaseConnection, resetSupabaseClient } from "@/lib/supabase-client"
import { RefreshCw, Database, Wifi, WifiOff, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useSupabaseSingleton } from "@/hooks/use-supabase-singleton"

export function SupabaseConnectionStatus() {
  const [connectionHealth, setConnectionHealth] = useState(getConnectionHealth())
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<number | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const supabase = useSupabaseSingleton()

  // Update connection health periodically
  useEffect(() => {
    const updateHealth = () => {
      setConnectionHealth(getConnectionHealth())
    }

    // Update immediately
    updateHealth()

    // Then update every 10 seconds
    const interval = setInterval(updateHealth, 10000)

    return () => clearInterval(interval)
  }, [])

  // Handle manual connection check
  const handleCheckConnection = async () => {
    setIsChecking(true)
    try {
      const isConnected = await checkSupabaseConnection()
      setConnectionHealth(getConnectionHealth())
      setLastCheck(Date.now())
    } catch (error) {
      console.error("Error checking connection:", error)
    } finally {
      setIsChecking(false)
    }
  }

  // Handle client reset
  const handleResetClient = () => {
    resetSupabaseClient()
    setConnectionHealth(getConnectionHealth())
    setLastCheck(Date.now())
  }

  // Format time
  const formatTime = (timestamp: number): string => {
    if (!timestamp) return "Never"
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  // Calculate connection quality percentage
  const connectionQuality = connectionHealth.isHealthy
    ? Math.max(0, Math.min(100, 100 - connectionHealth.connectionAttempts * 20))
    : 0

  // Check if we've never had a successful connection
  const neverConnected = connectionHealth.lastSuccessfulConnection === 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Supabase Connection
          </CardTitle>
          <Badge
            variant={connectionHealth.isHealthy ? "default" : "destructive"}
            className={connectionHealth.isHealthy ? "bg-green-500" : "animate-pulse"}
          >
            {connectionHealth.isHealthy ? "Connected" : neverConnected ? "Never Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {neverConnected && (
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>No Connection Established</AlertTitle>
            <AlertDescription>
              <p className="mb-2">No successful connection has been established yet. This could be due to:</p>
              <ul className="list-disc pl-5 mb-2 text-sm">
                <li>Your internet connection is offline</li>
                <li>The Supabase service is temporarily unavailable</li>
                <li>Authentication credentials are invalid</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {!connectionHealth.isHealthy && !neverConnected && (
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Connection Issue</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Unable to connect to Supabase. This could be due to:</p>
              <ul className="list-disc pl-5 mb-2 text-sm">
                <li>Your internet connection is offline</li>
                <li>The Supabase service is temporarily unavailable</li>
                <li>Authentication credentials have expired</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {connectionHealth.isHealthy && connectionHealth.connectionAttempts > 0 && (
          <Alert className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Connection Instability</AlertTitle>
            <AlertDescription>
              The connection has experienced {connectionHealth.connectionAttempts} recent issue(s). Performance may be
              affected.
            </AlertDescription>
          </Alert>
        )}

        {connectionHealth.isHealthy && connectionHealth.connectionAttempts === 0 && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Healthy Connection</AlertTitle>
            <AlertDescription>Your connection to Supabase is stable and performing optimally.</AlertDescription>
          </Alert>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>Connection Quality</span>
            <span className="font-medium">{connectionQuality}%</span>
          </div>
          <Progress
            value={connectionQuality}
            className="h-2"
            indicatorColor={connectionQuality > 80 ? "#10b981" : connectionQuality > 50 ? "#f59e0b" : "#ef4444"}
          />
        </div>

        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckConnection}
            disabled={isChecking}
            className="flex items-center gap-1"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Checking...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" /> Check Connection
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={handleResetClient} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" /> Reset Client
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)} className="w-full text-xs">
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>

        {showDetails && (
          <div className="mt-2 rounded border p-3 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Successful Connection:</span>
              <span className="font-mono">
                {connectionHealth.lastSuccessfulConnection
                  ? formatTime(connectionHealth.lastSuccessfulConnection)
                  : "Never"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connection Attempts:</span>
              <span className="font-mono">{connectionHealth.connectionAttempts}</span>
            </div>
            {lastCheck && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Check:</span>
                <span className="font-mono">{formatTime(lastCheck)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Browser Online Status:</span>
              <span className={`font-mono ${navigator.onLine ? "text-green-600" : "text-red-600"}`}>
                {navigator.onLine ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
