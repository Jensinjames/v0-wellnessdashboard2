"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

export function SessionStatus() {
  const { session, user, refreshSession } = useAuth()
  const [lastChecked, setLastChecked] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<"valid" | "expired" | "unknown">("unknown")

  useEffect(() => {
    checkSessionStatus()
    // Check every minute
    const interval = setInterval(checkSessionStatus, 60000)
    return () => clearInterval(interval)
  }, [session])

  const checkSessionStatus = () => {
    setLastChecked(new Date())

    if (!session) {
      setSessionStatus("unknown")
      return
    }

    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
    const now = Date.now()

    if (expiresAt <= now) {
      setSessionStatus("expired")
    } else {
      setSessionStatus("valid")
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshSession()
      checkSessionStatus()
    } catch (error) {
      console.error("Error refreshing session:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getTimeUntilExpiry = () => {
    if (!session || !session.expires_at) return "Unknown"

    const expiresAt = session.expires_at * 1000
    const now = Date.now()
    const diff = expiresAt - now

    if (diff <= 0) return "Expired"

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    return `${minutes}m ${seconds}s`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Authentication Status
          {sessionStatus === "valid" ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" /> Valid
            </Badge>
          ) : sessionStatus === "expired" ? (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <XCircle className="w-3 h-3 mr-1" /> Expired
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <AlertTriangle className="w-3 h-3 mr-1" /> Unknown
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Last checked: {lastChecked.toLocaleTimeString()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">User ID:</div>
          <div className="truncate">{user?.id || "Not signed in"}</div>

          <div className="font-medium">Email:</div>
          <div className="truncate">{user?.email || "N/A"}</div>

          <div className="font-medium">Session Expires:</div>
          <div>{session ? new Date(session.expires_at! * 1000).toLocaleString() : "N/A"}</div>

          <div className="font-medium">Time Until Expiry:</div>
          <div>{getTimeUntilExpiry()}</div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleRefresh} disabled={isRefreshing || !session} size="sm" className="w-full">
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Session
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
