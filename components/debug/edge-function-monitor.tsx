/**
 * Edge Function Monitor
 * Component for monitoring and debugging Edge Functions
 */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getEdgeFunctionLogs, clearEdgeFunctionLogs } from "@/utils/edge-function-debug"
import { checkEdgeFunctionHealth } from "@/services/edge-function-service"
import { getEdgeFunctionUrl } from "@/lib/edge-function-config"

export function EdgeFunctionMonitor() {
  const [logs, setLogs] = useState<any[]>([])
  const [edgeFunctionUrl, setEdgeFunctionUrl] = useState<string | null>(null)
  const [healthStatus, setHealthStatus] = useState<{
    status: string
    version: string
    timestamp: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load logs and Edge Function URL on mount
  useEffect(() => {
    setLogs(getEdgeFunctionLogs())

    // Get Edge Function URL
    const loadUrl = async () => {
      const url = await getEdgeFunctionUrl()
      setEdgeFunctionUrl(url)
    }

    loadUrl()

    // Refresh logs every 5 seconds
    const interval = setInterval(() => {
      setLogs(getEdgeFunctionLogs())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Check Edge Function health
  const checkHealth = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const health = await checkEdgeFunctionHealth()
      setHealthStatus(health)
    } catch (err: any) {
      setError(err.message || "Failed to check Edge Function health")
      setHealthStatus(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Clear logs
  const handleClearLogs = () => {
    clearEdgeFunctionLogs()
    setLogs([])
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edge Function Monitor</CardTitle>
        <CardDescription>Monitor and debug Supabase Edge Functions</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Edge Function URL</h3>
          <div className="p-2 bg-gray-100 rounded-md dark:bg-gray-800">
            {edgeFunctionUrl ? (
              <code className="text-sm">{edgeFunctionUrl}</code>
            ) : (
              <span className="text-sm text-gray-500">Not configured</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Health Status</h3>
            <Button variant="outline" size="sm" onClick={checkHealth} disabled={isLoading || !edgeFunctionUrl}>
              {isLoading ? "Checking..." : "Check Health"}
            </Button>
          </div>

          {error && <div className="p-2 text-sm text-red-500 bg-red-50 rounded-md dark:bg-red-900/20">{error}</div>}

          {healthStatus && (
            <div className="p-2 bg-gray-100 rounded-md space-y-2 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={healthStatus.status === "ok" ? "default" : "destructive"}>{healthStatus.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Version:</span>
                <span className="text-sm">{healthStatus.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Check:</span>
                <span className="text-sm">{new Date(healthStatus.timestamp).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Recent Logs</h3>
            <Button variant="outline" size="sm" onClick={handleClearLogs} disabled={logs.length === 0}>
              Clear Logs
            </Button>
          </div>

          {logs.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No logs available</div>
          ) : (
            <div className="max-h-96 overflow-auto border rounded-md">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 text-sm border-b ${log.status === "error" ? "bg-red-50 dark:bg-red-900/20" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{log.functionName}</span>
                    <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    <span>{log.duration.toFixed(2)}ms</span>
                  </div>
                  {log.error && (
                    <div className="mt-1 text-xs text-red-500">{log.error.message || JSON.stringify(log.error)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </CardFooter>
    </Card>
  )
}
