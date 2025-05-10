/**
 * Component to monitor and display GoTrueClient instances
 * This is useful for debugging and ensuring only one instance exists
 */

"use client"

import { useState } from "react"
import { useClientMonitor } from "@/hooks/use-client-monitor"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseClient, resetSupabaseClient } from "@/lib/supabase-singleton"

export function ClientInstanceMonitor() {
  const { stats, refreshStats, forceCleanup, lastCleanup, hasMultipleInstances } = useClientMonitor()
  const [expanded, setExpanded] = useState(false)

  // Function to reset the client
  const handleReset = () => {
    resetSupabaseClient()
    // Create a new client immediately to ensure we have one
    getSupabaseClient()
    refreshStats()
  }

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
            <span className="font-medium">{stats.hasGlobalClient ? "Yes" : "No"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">GoTrueClient Count</span>
            <span className="font-medium">{stats.goTrueClientCount}</span>
          </div>
        </div>

        {expanded && (
          <div className="mt-4">
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
