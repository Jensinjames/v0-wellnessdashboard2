"use client"

/**
 * Client Monitor Component
 *
 * This component displays information about the Supabase client instances
 * and provides tools for debugging and monitoring.
 *
 * IMPORTANT: This component is only rendered in development mode.
 */

import { useState, useEffect } from "react"
import { getClientStats, resetSupabaseClient, cleanupOrphanedClients } from "@/lib/supabase-singleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ClientMonitorProps {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function ClientMonitor({ autoRefresh = true, refreshInterval = 5000 }: ClientMonitorProps) {
  const [stats, setStats] = useState(getClientStats())
  const [expanded, setExpanded] = useState(false)
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null)
  const [hasMultipleInstances, setHasMultipleInstances] = useState(stats.goTrueClientCount > 1)

  // Only render in development mode
  if (process.env.NODE_ENV === "production") {
    return null
  }

  // Function to refresh stats
  const refreshStats = () => {
    const newStats = getClientStats()
    setStats(newStats)
    setHasMultipleInstances(newStats.goTrueClientCount > 1)
  }

  // Function to force cleanup
  const forceCleanup = () => {
    cleanupOrphanedClients(true)
    setLastCleanup(new Date())
    refreshStats()
  }

  // Function to reset the client
  const handleReset = () => {
    resetSupabaseClient()
    refreshStats()
  }

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshStats()

      // Auto-cleanup if needed
      if (stats.goTrueClientCount > 1) {
        cleanupOrphanedClients(true)
        setLastCleanup(new Date())
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, stats.goTrueClientCount])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Supabase Client Monitor</span>
          {hasMultipleInstances ? (
            <Badge variant="destructive">Multiple Instances</Badge>
          ) : (
            <Badge variant="outline">Single Instance</Badge>
          )}
        </CardTitle>
        <CardDescription>Monitor GoTrueClient instances to prevent authentication issues</CardDescription>
      </CardHeader>
      <CardContent>
        {hasMultipleInstances && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Multiple GoTrueClient instances detected</AlertTitle>
            <AlertDescription>
              This can lead to authentication issues and undefined behavior. Click "Clean Up Instances" to fix this
              issue.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Global Client</span>
            <span className="font-medium">{stats.hasClient ? "Yes" : "No"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">GoTrueClient Count</span>
            <span className="font-medium">{stats.goTrueClientCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Initializing</span>
            <span className="font-medium">{stats.isInitializing ? "Yes" : "No"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Instance Count</span>
            <span className="font-medium">{stats.instanceCount}</span>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Client Created At</h4>
              <div className="bg-muted p-2 rounded-md text-xs">
                {stats.clientCreatedAt ? new Date(stats.clientCreatedAt).toLocaleString() : "N/A"}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Last Reset Time</h4>
              <div className="bg-muted p-2 rounded-md text-xs">
                {stats.lastResetTime ? new Date(stats.lastResetTime).toLocaleString() : "N/A"}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Storage Keys</h4>
              <div className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-32">
                {stats.storageKeys.length > 0 ? (
                  <ul className="list-disc pl-4">
                    {stats.storageKeys.map((key) => (
                      <li key={key}>{key}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No storage keys found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {lastCleanup && (
          <p className="text-xs text-muted-foreground mt-2">Last cleanup: {lastCleanup.toLocaleTimeString()}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Hide Details" : "Show Details"}
        </Button>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={refreshStats}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={forceCleanup}>
            Clean Up Instances
          </Button>
          <Button variant="destructive" size="sm" onClick={handleReset}>
            Reset Client
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
