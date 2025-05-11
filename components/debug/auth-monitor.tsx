/**
 * Auth Monitor Component
 * Displays information about GoTrueClient instances and authentication state
 */
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"
import { startAuthMonitoring, stopAuthMonitoring, getMonitoringData, isMonitoringActive } from "@/utils/auth-monitor"
import { getInstanceCount } from "@/lib/supabase-manager"

export function AuthMonitor() {
  const [instanceCount, setInstanceCount] = useState(0)
  const [lastChecked, setLastChecked] = useState<string>("Never")
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Start monitoring on mount
  useEffect(() => {
    const cleanup = startAuthMonitoring()
    setIsMonitoring(true)

    return () => {
      cleanup()
      setIsMonitoring(false)
    }
  }, [])

  // Update data periodically
  useEffect(() => {
    const updateData = () => {
      const data = getMonitoringData()
      setInstanceCount(data.instanceCount)
      setLastChecked(data.lastChecked ? new Date(data.lastChecked).toLocaleTimeString() : "Never")
      setIsMonitoring(isMonitoringActive())
    }

    // Initial update
    updateData()

    // Set up interval
    const interval = setInterval(updateData, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      // Get current instance count
      const count = getInstanceCount()
      setInstanceCount(count)
      setLastChecked(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Error refreshing auth monitor:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle toggle monitoring
  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      stopAuthMonitoring()
      setIsMonitoring(false)
    } else {
      startAuthMonitoring()
      setIsMonitoring(true)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Authentication Monitor
          <Badge variant={instanceCount > 1 ? "destructive" : "default"}>
            {instanceCount} {instanceCount === 1 ? "Instance" : "Instances"}
          </Badge>
        </CardTitle>
        <CardDescription>Monitors GoTrueClient instances to detect potential authentication issues</CardDescription>
      </CardHeader>
      <CardContent>
        {instanceCount > 1 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Multiple GoTrueClient instances detected. This may cause authentication issues.
            </AlertDescription>
          </Alert>
        )}

        {instanceCount === 1 && (
          <Alert variant="default" className="mb-4">
            <CheckCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Single GoTrueClient instance detected. Authentication should work correctly.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Instance Count:</span>
            <span className="font-medium">{instanceCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Checked:</span>
            <span className="font-medium">{lastChecked}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monitoring:</span>
            <span className="font-medium">{isMonitoring ? "Active" : "Inactive"}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
          <Button variant={isMonitoring ? "default" : "secondary"} size="sm" onClick={handleToggleMonitoring}>
            {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
