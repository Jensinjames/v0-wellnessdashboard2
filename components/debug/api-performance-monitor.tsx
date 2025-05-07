"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ApiPerformanceMonitor() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("cache")

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/debug/cache-stats")
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
      console.error("Error fetching API stats:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>API Performance Monitor</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">{error}</div>
        ) : stats ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="cache">Cache</TabsTrigger>
              <TabsTrigger value="deduplication">Deduplication</TabsTrigger>
              <TabsTrigger value="routes">Routes</TabsTrigger>
            </TabsList>

            <TabsContent value="cache">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-100 rounded-md">
                    <div className="text-sm font-medium text-gray-500">Cache Size</div>
                    <div className="text-2xl font-bold">{stats.cacheStats.size}</div>
                  </div>
                  <div className="p-4 bg-gray-100 rounded-md">
                    <div className="text-sm font-medium text-gray-500">Routes Cached</div>
                    <div className="text-2xl font-bold">{Object.keys(stats.cacheStats.byRoute).length}</div>
                  </div>
                  <div className="p-4 bg-gray-100 rounded-md">
                    <div className="text-sm font-medium text-gray-500">Last Updated</div>
                    <div className="text-sm">{new Date(stats.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Cache Entries by Route</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.cacheStats.byRoute).map(([route, count]: [string, any]) => (
                      <div key={route} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="font-mono text-sm">{route}</div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deduplication">
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-md">
                  <div className="text-sm font-medium text-gray-500">Pending Requests</div>
                  <div className="text-2xl font-bold">{stats.deduplicationStats.pendingCount}</div>
                </div>

                {stats.deduplicationStats.pendingCount > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Pending Request Keys</h3>
                    <div className="space-y-2">
                      {Object.entries(stats.deduplicationStats.keys).map(([key, data]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="font-mono text-sm">{key}</div>
                          <Badge variant="outline">{data.age}ms</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="routes">
              <div className="space-y-4">
                <h3 className="text-sm font-medium mb-2">Cache Entries</h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {Object.entries(stats.cacheStats.entries).map(([key, data]: [string, any]) => (
                    <div key={key} className="p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm truncate max-w-[300px]">{key}</div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">Age: {Math.round(data.age / 1000)}s</Badge>
                          <Badge variant="outline">TTL: {Math.round((data.expiry - data.age) / 1000)}s</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-40">
            <div className="text-gray-500">Loading stats...</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
