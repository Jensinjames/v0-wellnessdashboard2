"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOptimisticWellness } from "@/hooks/use-optimistic-wellness"

export function OptimisticUpdatesMonitor() {
  const { getOptimisticStats } = useOptimisticWellness()
  const [stats, setStats] = useState<any>(getOptimisticStats())
  const [expanded, setExpanded] = useState(false)

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getOptimisticStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [getOptimisticStats])

  // Check if there are any pending updates
  const hasPendingUpdates = stats.pending > 0

  // Create detailed table for each table's stats
  const tableData = Object.entries(stats.byTable).map(([tableName, tableStats]: [string, any]) => ({
    tableName,
    ...tableStats,
  }))

  return (
    <Card className={`border ${hasPendingUpdates ? "border-blue-300" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">Optimistic Updates</CardTitle>
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-500 hover:underline">
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center space-x-2 text-sm">
          <span>Status:</span>
          {hasPendingUpdates ? (
            <Badge variant="outline" className="text-blue-500 border-blue-300">
              {stats.pending} pending updates
            </Badge>
          ) : (
            <Badge variant="outline" className="text-green-500 border-green-300">
              All updates synced
            </Badge>
          )}
        </div>

        {expanded && (
          <div className="mt-3 text-xs">
            <div className="mb-2 flex space-x-4">
              <div>Total: {stats.total}</div>
              <div>Pending: {stats.pending}</div>
              <div>Confirmed: {stats.confirmed}</div>
              <div>Failed: {stats.failed}</div>
            </div>

            {tableData.length > 0 && (
              <div className="border rounded-md mt-2 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confirmed
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Failed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.map((table) => (
                      <tr key={table.tableName}>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">{table.tableName}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-blue-500">{table.pending}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-green-500">{table.confirmed}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-red-500">{table.failed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
