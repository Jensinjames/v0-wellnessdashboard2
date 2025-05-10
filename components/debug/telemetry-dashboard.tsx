"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getRLSTelemetry } from "@/lib/rls-telemetry"
import { getQueryCache } from "@/lib/query-cache"
import { getRequestDeduplication } from "@/lib/request-deduplication"
import { getOptimisticUpdates } from "@/lib/optimistic-updates"
import { getRetryMechanism } from "@/lib/retry-mechanism"

export function TelemetryDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshKey, setRefreshKey] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Get instances
  const telemetry = getRLSTelemetry()
  const cache = getQueryCache()
  const deduplication = getRequestDeduplication()
  const optimistic = getOptimisticUpdates()
  const retry = getRetryMechanism()

  // Stats
  const [telemetryStats, setTelemetryStats] = useState(telemetry.getStats())
  const [cacheStats, setCacheStats] = useState(cache.getStats())
  const [deduplicationStats, setDeduplicationStats] = useState(deduplication.getStats())
  const [optimisticStats, setOptimisticStats] = useState(optimistic.getStats())
  const [retryStats, setRetryStats] = useState(retry.getStats())

  // Refresh stats
  const refreshStats = () => {
    setTelemetryStats(telemetry.getStats())
    setCacheStats(cache.getStats())
    setDeduplicationStats(deduplication.getStats())
    setOptimisticStats(optimistic.getStats())
    setRetryStats(retry.getStats())
    setRefreshKey((prev) => prev + 1)
  }

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshStats()
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Initial load
  useEffect(() => {
    refreshStats()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>RLS Optimization Telemetry</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshStats}>
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto-refresh: On" : "Auto-refresh: Off"}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Monitor and analyze RLS call frequency and optimization effectiveness</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
            <TabsTrigger value="deduplication">Deduplication</TabsTrigger>
            <TabsTrigger value="optimistic">Optimistic Updates</TabsTrigger>
            <TabsTrigger value="retry">Retry Mechanism</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Query Cache"
                stats={[
                  { label: "Size", value: cacheStats.size },
                  { label: "Hits", value: cacheStats.hits },
                  { label: "Misses", value: cacheStats.misses },
                  {
                    label: "Hit Rate",
                    value: `${((cacheStats.hits / (cacheStats.hits + cacheStats.misses || 1)) * 100).toFixed(1)}%`,
                  },
                ]}
              />
              <StatsCard
                title="Deduplication"
                stats={[
                  { label: "Total Requests", value: deduplicationStats.totalRequests },
                  { label: "Deduplicated", value: deduplicationStats.deduplicatedRequests },
                  { label: "Active Requests", value: deduplicationStats.activeRequests },
                  { label: "Saved Requests", value: deduplicationStats.savedNetworkRequests },
                ]}
              />
              <StatsCard
                title="Optimistic Updates"
                stats={[
                  { label: "Total", value: optimisticStats.total },
                  { label: "Pending", value: optimisticStats.pending },
                  { label: "Confirmed", value: optimisticStats.confirmed },
                  { label: "Failed", value: optimisticStats.failed },
                ]}
              />
              <StatsCard
                title="Retry Mechanism"
                stats={[
                  { label: "Attempts", value: retryStats.attempts },
                  { label: "Successes", value: retryStats.successes },
                  { label: "Failures", value: retryStats.failures },
                  { label: "Retries", value: retryStats.retries },
                ]}
              />
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">RLS Call Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">By Operation Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(telemetryStats.byOperation || {}).map(([operation, count]) => (
                        <div key={operation} className="flex justify-between items-center">
                          <span className="text-sm">{operation}</span>
                          <span className="font-mono text-sm">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">By Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(telemetryStats.byTable || {}).map(([table, count]) => (
                        <div key={table} className="flex justify-between items-center">
                          <span className="text-sm">{table}</span>
                          <span className="font-mono text-sm">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cache" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <StatsCard
                title="Cache Performance"
                stats={[
                  { label: "Size", value: cacheStats.size },
                  { label: "Hits", value: cacheStats.hits },
                  { label: "Misses", value: cacheStats.misses },
                ]}
              />
              <StatsCard
                title="Cache Efficiency"
                stats={[
                  {
                    label: "Hit Rate",
                    value: `${((cacheStats.hits / (cacheStats.hits + cacheStats.misses || 1)) * 100).toFixed(1)}%`,
                  },
                  { label: "Expired", value: cacheStats.expired },
                  { label: "Evictions", value: cacheStats.evictions },
                ]}
              />
              <div className="flex justify-end items-center">
                <Button variant="outline" size="sm" onClick={() => cache.clear()}>
                  Clear Cache
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deduplication" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <StatsCard
                title="Deduplication Performance"
                stats={[
                  { label: "Total Requests", value: deduplicationStats.totalRequests },
                  { label: "Deduplicated", value: deduplicationStats.deduplicatedRequests },
                  { label: "Active Requests", value: deduplicationStats.activeRequests },
                ]}
              />
              <StatsCard
                title="Deduplication Efficiency"
                stats={[
                  {
                    label: "Deduplication Rate",
                    value: `${((deduplicationStats.deduplicatedRequests / (deduplicationStats.totalRequests || 1)) * 100).toFixed(1)}%`,
                  },
                  { label: "Saved Requests", value: deduplicationStats.savedNetworkRequests },
                ]}
              />
            </div>
          </TabsContent>

          <TabsContent value="optimistic" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <StatsCard
                title="Optimistic Updates Status"
                stats={[
                  { label: "Total", value: optimisticStats.total },
                  { label: "Pending", value: optimisticStats.pending },
                  { label: "Confirmed", value: optimisticStats.confirmed },
                  { label: "Failed", value: optimisticStats.failed },
                ]}
              />
              <StatsCard
                title="Optimistic Updates by Table"
                stats={Object.entries(optimisticStats.byTable || {}).map(([table, counts]) => ({
                  label: table,
                  value: `${counts.pending}/${counts.confirmed}/${counts.failed}`,
                }))}
              />
              <div className="flex justify-end items-center">
                <Button variant="outline" size="sm" onClick={() => optimistic.clear()}>
                  Clear Updates
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="retry" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <StatsCard
                title="Retry Performance"
                stats={[
                  { label: "Attempts", value: retryStats.attempts },
                  { label: "Successes", value: retryStats.successes },
                  { label: "Failures", value: retryStats.failures },
                ]}
              />
              <StatsCard
                title="Retry Efficiency"
                stats={[
                  {
                    label: "Success Rate",
                    value: `${((retryStats.successes / (retryStats.attempts || 1)) * 100).toFixed(1)}%`,
                  },
                  { label: "Retry Count", value: retryStats.retries },
                  {
                    label: "Recovery Rate",
                    value: `${((retryStats.retries / (retryStats.retries + retryStats.failures || 1)) * 100).toFixed(1)}%`,
                  },
                ]}
              />
              <div className="flex justify-end items-center">
                <Button variant="outline" size="sm" onClick={() => retry.resetStats()}>
                  Reset Stats
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</CardFooter>
    </Card>
  )
}

type StatsCardProps = {
  title: string
  stats: Array<{ label: string; value: string | number }>
}

function StatsCard({ title, stats }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stats.map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm">{stat.label}</span>
              <span className="font-mono text-sm">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
