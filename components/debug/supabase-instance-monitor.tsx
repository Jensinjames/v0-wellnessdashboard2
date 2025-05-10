"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSupabaseSingletonDebugInfo, resetSupabaseSingleton } from "@/lib/supabase-singleton"
import { getClientDebugInfo, cleanupOrphanedClients } from "@/lib/supabase-client-enhanced"

export function SupabaseInstanceMonitor() {
  const [singletonInfo, setSingletonInfo] = useState(getSupabaseSingletonDebugInfo())
  const [clientInfo, setClientInfo] = useState(getClientDebugInfo())
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSingletonInfo(getSupabaseSingletonDebugInfo())
      setClientInfo(getClientDebugInfo())
    }, 2000)

    return () => clearInterval(intervalId)
  }, [])

  const handleRefresh = () => {
    setSingletonInfo(getSupabaseSingletonDebugInfo())
    setClientInfo(getClientDebugInfo())
    setRefreshCount((prev) => prev + 1)
  }

  const handleResetSingleton = () => {
    resetSupabaseSingleton()
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
          <Badge variant={clientInfo.goTrueClientCount > 1 ? "destructive" : "success"}>
            {clientInfo.goTrueClientCount} GoTrue Instances
          </Badge>
        </CardTitle>
        <CardDescription>Monitor and manage Supabase client instances to prevent authentication issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Singleton Status</h3>
            <div className="rounded-md bg-muted p-3 text-sm">
              <p>Has Instance: {singletonInfo.hasInstance ? "Yes" : "No"}</p>
              <p>Initializing: {singletonInfo.isInitializing ? "Yes" : "No"}</p>
              <p>Instance Count: {singletonInfo.instanceCount}</p>
              <p>GoTrue Clients: {singletonInfo.goTrueClientCount}</p>
              {singletonInfo.lastInitTime && (
                <p>Last Init: {new Date(singletonInfo.lastInitTime).toLocaleTimeString()}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Enhanced Client Status</h3>
            <div className="rounded-md bg-muted p-3 text-sm">
              <p>Has Client: {clientInfo.hasClient ? "Yes" : "No"}</p>
              <p>Initializing: {clientInfo.isInitializing ? "Yes" : "No"}</p>
              <p>Instance Count: {clientInfo.clientInstanceCount}</p>
              <p>GoTrue Clients: {clientInfo.goTrueClientCount}</p>
              {clientInfo.clientInitTime && (
                <p>Last Init: {new Date(clientInfo.clientInitTime).toLocaleTimeString()}</p>
              )}
            </div>
          </div>
        </div>

        {clientInfo.goTrueClientCount > 1 && (
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
          <Button variant="default" size="sm" onClick={handleResetSingleton}>
            Reset Singleton
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
