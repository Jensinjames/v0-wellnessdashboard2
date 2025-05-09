"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useOperationQueue } from "@/hooks/use-operation-queue"

export function OperationQueueMonitor() {
  const { getQueueStats, clearQueue } = useOperationQueue()
  const [stats, setStats] = useState({ length: 0, active: 0 })

  useEffect(() => {
    // Update stats every 500ms
    const interval = setInterval(() => {
      setStats(getQueueStats())
    }, 500)

    return () => clearInterval(interval)
  }, [getQueueStats])

  const totalOperations = stats.length + stats.active

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Operation Queue</span>
          <Button variant="outline" size="sm" onClick={clearQueue} disabled={totalOperations === 0}>
            Clear Queue
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Active Operations: {stats.active}</span>
            <span>Queued Operations: {stats.length}</span>
          </div>

          {totalOperations > 0 && (
            <div className="space-y-2">
              <Progress
                value={stats.active > 0 ? (stats.active / (stats.active + stats.length)) * 100 : 0}
                className="h-2"
              />
              <div className="text-xs text-gray-500 text-center">
                {stats.active} active / {totalOperations} total
              </div>
            </div>
          )}

          {totalOperations === 0 && <div className="text-center text-gray-500 py-4">No operations in queue</div>}
        </div>
      </CardContent>
    </Card>
  )
}
