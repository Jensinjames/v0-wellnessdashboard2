"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getConnectionHealth, resetSupabaseClient, checkSupabaseConnection } from "@/lib/supabase-client-enhanced"

export function ConnectionMonitor() {
  const [clientHealth, setClientHealth] = useState<any>(null)
  const [poolStats, setPoolStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      setIsLoading(true)

      // Get client health
      const health = getConnectionHealth()
      setClientHealth(health)

      // Get pool stats from server
      const response = await fetch("/api/debug/connection-stats")
      if (response.ok) {
        const data = await response.json()
        setPoolStats(data.poolStats)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching connection stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResetClient() {
    try {
      setIsLoading(true)
      resetSupabaseClient()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await checkSupabaseConnection()
      await fetchStats()
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResetPool() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/debug/reset-connection-pool", {
        method: "POST",
      })
      if (response.ok) {
        await fetchStats()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Database Connection Monitor
          <Badge variant={clientHealth?.isHealthy ? "success" : "destructive"}>
            {clientHealth?.isHealthy ? "Healthy" : "Unhealthy"}
          </Badge>
        </CardTitle>
        <CardDescription>Monitor and manage database connections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Client Connection</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Success Rate:</div>
              <div>{clientHealth?.successRate ? `${(clientHealth.successRate * 100).toFixed(1)}%` : "N/A"}</div>

              <div>Avg Latency:</div>
              <div>{clientHealth?.avgLatency ? `${clientHealth.avgLatency.toFixed(0)}ms` : "N/A"}</div>

              <div>Connection Attempts:</div>
              <div>{clientHealth?.connectionAttempts || 0}</div>

              <div>Last Success:</div>
              <div>
                {clientHealth?.lastSuccessfulConnection
                  ? new Date(clientHealth.lastSuccessfulConnection).toLocaleTimeString()
                  : "Never"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Connection Pool</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Total Connections:</div>
              <div>{poolStats?.totalConnections || "N/A"}</div>

              <div>Active Connections:</div>
              <div>{poolStats?.activeConnections || "N/A"}</div>

              <div>Idle Connections:</div>
              <div>{poolStats?.idleConnections || "N/A"}</div>

              <div>Waiting Clients:</div>
              <div>{poolStats?.waitingClients || "N/A"}</div>
            </div>
          </div>
        </div>

        {clientHealth?.recentHistory && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Recent Connection History</h3>
            <div className="flex space-x-1 h-8">
              {clientHealth.recentHistory.map((entry: any, i: number) => (
                <div
                  key={i}
                  className={`flex-1 ${entry.success ? "bg-green-500" : "bg-red-500"}`}
                  title={`${entry.success ? "Success" : "Failure"} - ${entry.latency}ms at ${new Date(entry.timestamp).toLocaleTimeString()}`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}
        </div>
        <div className="space-x-2">
          <Button size="sm" variant="outline" onClick={fetchStats} disabled={isLoading}>
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={handleResetClient} disabled={isLoading}>
            Reset Client
          </Button>
          <Button size="sm" variant="outline" onClick={handleResetPool} disabled={isLoading}>
            Reset Pool
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
