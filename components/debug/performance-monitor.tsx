"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getPerformanceMarks,
  getPerformanceStatsByCategory,
  clearPerformanceMarks,
  PerformanceCategory,
} from "@/utils/performance-monitor"

export function PerformanceMonitor() {
  const [marks, setMarks] = useState<ReturnType<typeof getPerformanceMarks>>([])
  const [stats, setStats] = useState<ReturnType<typeof getPerformanceStatsByCategory>>({} as any)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  // Refresh data
  const refreshData = () => {
    setMarks(getPerformanceMarks())
    setStats(getPerformanceStatsByCategory())
  }

  // Handle clear marks
  const handleClearMarks = () => {
    clearPerformanceMarks()
    refreshData()
  }

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshData()
    }, 2000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Initial load
  useEffect(() => {
    refreshData()
  }, [])

  // Format duration
  const formatDuration = (duration: number) => {
    return `${duration.toFixed(2)}ms`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Performance Monitoring</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto-refresh: On" : "Auto-refresh: Off"}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClearMarks}>
              Clear Data
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Monitor performance metrics across the application</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">All Operations</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="slow">Slow Operations</TabsTrigger>
            <TabsTrigger value="api">API Calls</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <PerformanceMarksList marks={marks} formatDuration={formatDuration} />
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <PerformanceStats stats={stats} formatDuration={formatDuration} />
          </TabsContent>

          <TabsContent value="slow" className="mt-0">
            <PerformanceMarksList
              marks={marks.filter((mark) => mark.duration && mark.duration > 500)}
              formatDuration={formatDuration}
              emptyMessage="No slow operations detected (>500ms)"
            />
          </TabsContent>

          <TabsContent value="api" className="mt-0">
            <PerformanceMarksList
              marks={marks.filter(
                (mark) =>
                  mark.category === PerformanceCategory.API || mark.category === PerformanceCategory.EDGE_FUNCTION,
              )}
              formatDuration={formatDuration}
              emptyMessage="No API operations recorded"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">Showing {marks.length} performance records</CardFooter>
    </Card>
  )
}

interface PerformanceMarksListProps {
  marks: ReturnType<typeof getPerformanceMarks>
  formatDuration: (duration: number) => string
  emptyMessage?: string
}

function PerformanceMarksList({
  marks,
  formatDuration,
  emptyMessage = "No performance data available",
}: PerformanceMarksListProps) {
  if (marks.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
  }

  return (
    <ScrollArea className="h-[500px] rounded-md border">
      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left font-medium p-2">Operation</th>
              <th className="text-left font-medium p-2">Category</th>
              <th className="text-left font-medium p-2">Duration</th>
              <th className="text-left font-medium p-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {marks.map((mark, index) => (
              <tr key={mark.id} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                <td className="p-2">{mark.name}</td>
                <td className="p-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-muted">{mark.category}</span>
                </td>
                <td className="p-2 font-mono">
                  {mark.duration !== undefined ? formatDuration(mark.duration) : "In progress"}
                </td>
                <td className="p-2 text-sm text-muted-foreground">{new Date(mark.startTime).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  )
}

interface PerformanceStatsProps {
  stats: ReturnType<typeof getPerformanceStatsByCategory>
  formatDuration: (duration: number) => string
}

function PerformanceStats({ stats, formatDuration }: PerformanceStatsProps) {
  if (!stats || Object.keys(stats).length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No statistics available</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(stats).map(([category, data]) => (
        <Card key={category}>
          <CardHeader className="py-4">
            <CardTitle className="text-lg">{category}</CardTitle>
            <CardDescription>{data.count} operations</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average:</span>
                <span className="font-mono">{formatDuration(data.averageDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Min:</span>
                <span className="font-mono">{formatDuration(data.minDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max:</span>
                <span className="font-mono">{formatDuration(data.maxDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="font-mono">{formatDuration(data.totalDuration)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
