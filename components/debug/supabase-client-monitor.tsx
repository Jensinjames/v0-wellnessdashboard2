"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseClientMetrics, resetSupabaseClient, getSupabaseClient } from "@/lib/supabase-client-core"

export function SupabaseClientMonitor() {
  const [metrics, setMetrics] = useState(getSupabaseClientMetrics())
  const [refreshKey, setRefreshKey] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; latency?: number } | null>(null)

  // Refresh metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getSupabaseClientMetrics())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Force refresh
  const handleRefresh = () => {
    setMetrics(getSupabaseClientMetrics())
    setRefreshKey((prev) => prev + 1)
  }

  // Test connection
  const handleTestConnection = async () => {
    try {
      const client = getSupabaseClient()
      const startTime = Date.now()
      const { error } = await client.from("profiles").select("count", { count: "exact", head: true })
      const latency = Date.now() - startTime

      setConnectionStatus({
        success: !error,
        latency,
      })
    } catch (error) {
      setConnectionStatus({ success: false })
    }
  }

  // Reset client
  const handleReset = () => {
    resetSupabaseClient()
    handleRefresh()
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-slate-50">
        <CardTitle>Supabase Client Monitor</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-semibold">Status:</div>
          <div className={metrics.hasActiveClient ? "text-green-600" : "text-red-600"}>
            {metrics.hasActiveClient ? "Active" : "Not Initialized"}
          </div>

          <div className="font-semibold">Initializations:</div>
          <div>{metrics.clientInitCount}</div>

          <div className="font-semibold">Last Initialized:</div>
          <div>{metrics.lastInitTime ? new Date(metrics.lastInitTime).toLocaleTimeString() : "Never"}</div>

          <div className="font-semibold">Last Reset:</div>
          <div>{metrics.lastResetTime ? new Date(metrics.lastResetTime).toLocaleTimeString() : "Never"}</div>

          <div className="font-semibold">Connection Rate:</div>
          <div>{(metrics.recentSuccessRate * 100).toFixed(1)}%</div>

          <div className="font-semibold">Avg Latency:</div>
          <div>{metrics.avgLatency.toFixed(1)}ms</div>

          <div className="font-semibold">Connection Test:</div>
          <div>
            {connectionStatus ? (
              <span className={connectionStatus.success ? "text-green-600" : "text-red-600"}>
                {connectionStatus.success ? `Success (${connectionStatus.latency}ms)` : "Failed"}
              </span>
            ) : (
              "Not tested"
            )}
          </div>
        </div>

        {metrics.recentErrors.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Recent Errors:</h3>
            <ul className="text-xs text-red-500 space-y-1">
              {metrics.recentErrors.map((error, i) => (
                <li key={i} className="truncate">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={handleTestConnection}>
            Test Connection
          </Button>
          <Button size="sm" variant="destructive" onClick={handleReset}>
            Reset Client
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
