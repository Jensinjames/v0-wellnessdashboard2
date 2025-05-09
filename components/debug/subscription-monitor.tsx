"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { SubscriptionStatus } from "@/lib/subscription-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function SubscriptionMonitor() {
  const { getSubscriptionStats, cleanupSubscriptions } = useSupabase()
  const [stats, setStats] = useState<ReturnType<typeof getSubscriptionStats>>({ subscriptions: [], count: 0 })

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      setStats(getSubscriptionStats())
    }

    // Initial update
    updateStats()

    // Set up interval
    const interval = setInterval(updateStats, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [getSubscriptionStats])

  // Status badge color
  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.CONNECTED:
        return "bg-green-500"
      case SubscriptionStatus.CONNECTING:
        return "bg-yellow-500"
      case SubscriptionStatus.ERROR:
        return "bg-red-500"
      case SubscriptionStatus.CLOSED:
        return "bg-gray-500"
      case SubscriptionStatus.INACTIVE:
        return "bg-gray-300"
      default:
        return "bg-gray-300"
    }
  }

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60000) {
      return `${Math.floor(diff / 1000)}s ago`
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`
    } else {
      return new Date(timestamp).toLocaleTimeString()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Active Subscriptions
          <Badge>{stats.count}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.count === 0 ? (
          <p className="text-gray-500">No active subscriptions</p>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={cleanupSubscriptions}>
                Clean Up All
              </Button>
            </div>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Table</th>
                    <th className="text-left py-2">Filter</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Subscribers</th>
                    <th className="text-left py-2">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b">
                      <td className="py-2">{sub.table}</td>
                      <td className="py-2 text-xs">{sub.filter || "*"}</td>
                      <td className="py-2">
                        <Badge className={getStatusColor(sub.status)}>{sub.status}</Badge>
                      </td>
                      <td className="py-2 text-center">{sub.subscribers}</td>
                      <td className="py-2">{formatTime(sub.lastUpdated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
