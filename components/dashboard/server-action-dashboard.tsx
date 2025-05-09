"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getDashboardData } from "@/utils/supabase-functions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart } from "@/components/dashboard/pie-chart"
import { RadialChart } from "@/components/dashboard/radial-chart"
import { LoadingAnimation } from "@/components/ui/loading-animation"
import { Badge } from "@/components/ui/badge"
import { OptimisticFeedback } from "@/components/ui/optimistic-feedback"
import { ServerActionTrackingHistory } from "@/components/dashboard/server-action-tracking-history"
import { OptimisticServerActionEntryForm } from "@/components/dashboard/optimistic-server-action-entry-form"
import { getOptimisticUpdates } from "@/lib/optimistic-updates"

export function ServerActionDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "year">("week")
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Set up optimistic updates listener
  useEffect(() => {
    const optimistic = getOptimisticUpdates()

    const updateListener = () => {
      // Refresh data when optimistic updates change
      if (dashboardData) {
        // Apply optimistic updates to the dashboard data
        const optimisticEntries = optimistic.applyUpdates("wellness_entries", dashboardData.entries || [])
        setDashboardData((prev) => ({
          ...prev,
          entries: optimisticEntries,
        }))
      }
    }

    optimistic.addListener(updateListener)

    return () => {
      optimistic.removeListener(updateListener)
    }
  }, [dashboardData])

  // Fetch dashboard data
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const { success, data, error } = await getDashboardData(user.id, timeframe)

        if (!success || !data) {
          throw new Error(error || "Failed to fetch dashboard data")
        }

        setDashboardData(data)
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err)
        setError(err.message || "Failed to fetch dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, timeframe, refreshTrigger])

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as "day" | "week" | "month" | "year")
  }

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // Handle retry for failed operations
  const handleRetry = (failedIds: string[]) => {
    // In a real implementation, you would retry the failed operations
    // For now, we'll just refresh the data
    refreshData()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingAnimation />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>Error loading dashboard: {error}</p>
            <button onClick={() => refreshData()} className="mt-4 px-4 py-2 bg-primary text-white rounded-md">
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p>No dashboard data available. Start tracking your wellness activities!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Optimistic feedback component */}
      <OptimisticFeedback table="wellness_entries" onRetry={handleRetry} />

      <Tabs defaultValue="week" onValueChange={handleTimeframeChange}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Wellness Dashboard</h2>
          <TabsList>
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="day" className="space-y-4">
          <DashboardContent data={dashboardData} timeframe="day" userId={user?.id} />
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <DashboardContent data={dashboardData} timeframe="week" userId={user?.id} />
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <DashboardContent data={dashboardData} timeframe="month" userId={user?.id} />
        </TabsContent>

        <TabsContent value="year" className="space-y-4">
          <DashboardContent data={dashboardData} timeframe="year" userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardContent({ data, timeframe, userId }: { data: any; timeframe: string; userId?: string }) {
  const { entries = [], goals = [], categories = [], stats = {} } = data
  const optimistic = getOptimisticUpdates()

  // Apply optimistic updates to entries
  const optimisticEntries = optimistic.applyUpdates("wellness_entries", entries)

  // Check if there are any optimistic entries
  const hasOptimisticEntries = optimisticEntries.some((entry: any) => entry.__optimistic)

  // Calculate total hours from optimistic entries
  const totalHours = optimisticEntries.reduce((acc: number, entry: any) => {
    return acc + (entry.__deleted ? 0 : entry.duration || 0)
  }, 0)

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <h3 className="text-3xl font-bold">
                {optimisticEntries.filter((e: any) => !e.__deleted).length || 0}
                {hasOptimisticEntries && (
                  <Badge variant="outline" className="ml-2 text-xs align-middle border-blue-300 text-blue-500">
                    Updating
                  </Badge>
                )}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <h3 className="text-3xl font-bold">
                {totalHours.toFixed(1)}
                {hasOptimisticEntries && (
                  <Badge variant="outline" className="ml-2 text-xs align-middle border-blue-300 text-blue-500">
                    Updating
                  </Badge>
                )}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Categories Tracked</p>
              <h3 className="text-3xl font-bold">{stats?.categories_count || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Goal Completion</p>
              <h3 className="text-3xl font-bold">{stats?.completion_rate?.toFixed(0) || 0}%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={categories} entries={optimisticEntries.filter((e: any) => !e.__deleted)} />
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <RadialChart goals={goals} entries={optimisticEntries.filter((e: any) => !e.__deleted)} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Add Entry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ServerActionTrackingHistory entries={entries} categories={categories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Entry</CardTitle>
          </CardHeader>
          <CardContent>
            {userId ? (
              <OptimisticServerActionEntryForm categories={categories} userId={userId} />
            ) : (
              <div className="text-center py-4 text-gray-500">Please sign in to add entries</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
