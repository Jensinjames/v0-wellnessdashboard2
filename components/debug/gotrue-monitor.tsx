"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getClientDebugInfo, cleanupOrphanedClients } from "@/lib/supabase-client-consolidated"
import { isDebugMode } from "@/lib/env-utils-secure"

export function GoTrueMonitor() {
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [showMonitor, setShowMonitor] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)

  // Only show in debug mode
  useEffect(() => {
    setShowMonitor(isDebugMode())
  }, [])

  // Refresh client info
  useEffect(() => {
    if (showMonitor) {
      const info = getClientDebugInfo()
      setClientInfo(info)
    }
  }, [showMonitor, refreshCount])

  if (!showMonitor) {
    return null
  }

  const handleRefresh = () => {
    setRefreshCount((prev) => prev + 1)
  }

  const handleCleanup = () => {
    cleanupOrphanedClients(true)
    handleRefresh()
  }

  return (
    <Card className="w-full max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          GoTrueClient Monitor
          <Badge variant={clientInfo?.goTrueClientCount > 1 ? "destructive" : "outline"}>
            {clientInfo?.goTrueClientCount || 0} instances
          </Badge>
        </CardTitle>
        <CardDescription>Monitor and manage GoTrueClient instances</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {clientInfo?.goTrueClientCount > 1 && (
          <Alert variant="destructive">
            <AlertTitle>Multiple GoTrueClient instances detected!</AlertTitle>
            <AlertDescription>This can cause authentication issues. Use the cleanup button below.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Client Initialized:</div>
          <div>{clientInfo?.hasClient ? "Yes" : "No"}</div>

          <div className="font-medium">Instance Count:</div>
          <div>{clientInfo?.clientInstanceCount || 0}</div>

          <div className="font-medium">Init Time:</div>
          <div>{clientInfo?.clientInitTime ? new Date(clientInfo.clientInitTime).toLocaleTimeString() : "N/A"}</div>

          <div className="font-medium">Last Reset:</div>
          <div>{clientInfo?.lastResetTime ? new Date(clientInfo.lastResetTime).toLocaleTimeString() : "N/A"}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          Refresh
        </Button>
        <Button variant="destructive" size="sm" onClick={handleCleanup}>
          Cleanup Instances
        </Button>
      </CardFooter>
    </Card>
  )
}
