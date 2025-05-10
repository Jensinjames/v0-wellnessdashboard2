"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSupabaseDebugInfo, resetSupabaseClient, cleanupOrphanedClients } from "@/lib/supabase-singleton-manager"

export function SupabaseInstanceMonitor() {
  const [debugInfo, setDebugInfo] = useState(getSupabaseDebugInfo())
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDebugInfo(getSupabaseDebugInfo())
    }, 2000)

    return () => clearInterval(intervalId)
  }, [])

  const handleRefresh = () => {
    setDebugInfo(getSupabaseDebugInfo())
    setRefreshCount((prev) => prev + 1)
  }

  const handleResetClient = () => {
    resetSupabaseClient()
    handleRefresh()
  }

  const handleCleanupOrphaned = () => {
    cleanupOrphanedClients()
    handleRefresh()
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Supabase Instance Monitor
          <Badge variant={debugInfo.goTrueClientCount > 1 ? "destructive" : "success"}>
            {debugInfo.goTrueClientCount} GoTrue Instances
          </Badge>
        </CardTitle>
        <CardDescription>Monitor and manage Supabase client instances to prevent authentication issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Client Status</h3>
            <div className="rounded-md bg-muted p-3 text-sm">
              <p>Has Instance: {debugInfo.hasInstance ? "Yes" : "No"}</p>
              <p>Initializing: {debugInfo.isInitializing ? "Yes" : "No"}</p>
              <p>Instance Count: {debugInfo.instanceCount}</p>
              <p>GoTrue Clients: {debugInfo.goTrueClientCount}</p>
              {debugInfo.lastInitTime && <p>Last Init: {new Date(debugInfo.lastInitTime).toLocaleTimeString()}</p>}
              {debugInfo.lastResetTime && <p>Last Reset: {new Date(debugInfo.lastResetTime).toLocaleTimeString()}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Health Status</h3>
            <div className="rounded-md bg-muted p-3 text-sm">
              <p>Status: {debugInfo.hasInstance ? "Connected" : "Disconnected"}</p>
              <p>Initialization Promise: {debugInfo.hasInitPromise ? "Active" : "None"}</p>
            </div>
          </div>
        </div>

        {debugInfo.goTrueClientCount > 1 && (
          <div className="rounded-md bg-destructive/10 p-4 text-destructive">
            <h3 className="font-medium">Warning: Multiple GoTrueClient Instances Detected</h3>
            <p className="text-sm mt-1">
              Multiple instances can cause authentication issues. Use the "Cleanup Orphaned Clients" button to fix this.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Last refreshed: {refreshCount > 0 ? `${refreshCount} times` : "never"}
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleCleanupOrphaned}>
            Cleanup Orphaned Clients
          </Button>
          <Button variant="default" size="sm" onClick={handleResetClient}>
            Reset Client
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
