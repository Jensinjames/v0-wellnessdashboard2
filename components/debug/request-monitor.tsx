"use client"

import { useState, useEffect } from "react"
import { requestCoordinator } from "@/lib/request-coordinator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RequestMonitor() {
  const [stats, setStats] = useState<Record<string, { count: number; oldestTimestamp: number; operations: string[] }>>(
    {},
  )
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(requestCoordinator.getStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== "development") {
    return null
  }

  const hasActiveRequests = Object.keys(stats).length > 0

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className={`p-2 rounded-full shadow-lg ${hasActiveRequests ? "bg-yellow-500" : "bg-green-500"} text-white`}
        >
          {hasActiveRequests ? `${Object.values(stats).reduce((sum, s) => sum + s.count, 0)} Requests` : "Requests"}
        </button>
      )}

      {isVisible && (
        <Card className="w-80 shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Request Monitor</CardTitle>
              <button onClick={() => setIsVisible(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(stats).length === 0 ? (
              <div className="text-sm text-gray-500">No active requests</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats).map(([key, { count, oldestTimestamp, operations }]) => (
                  <div key={key} className="border-b pb-2">
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-xs truncate" title={key}>
                        {key}
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Age: {Math.round((Date.now() - oldestTimestamp) / 1000)}s
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {operations.map((op, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {op}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
