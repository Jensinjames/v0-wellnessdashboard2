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
import { useOptimisticWellness } from "@/hooks/use-optimistic-wellness"
import { OptimisticTrackingHistory } from "@/components/dashboard/optimistic-tracking-history"
import { OptimisticEntryForm } from "@/components/dashboard/optimistic-entry-form"

export function WellnessDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "year">("week")
  const [error, setError] = useState<string | null>(null)
  const { applyOptimisticEntries } = useOptimisticWellness()

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
  }, [user, timeframe])

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as "day" | "week" | "month" | "year")
  }

  const refreshData = () => {
    if (user) {
      getDashboardData(user.id, timeframe).then(({ success, data }) => {
        if (success && data) {
          setDashboardData(data)
        }
      })
    }
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
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
            >
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

  // Apply optimistic updates to entries if we have data
  const optimisticData = {
    ...dashboardData,
    entries: dashboardData.entries ? applyOptimisticEntries(dashboardData.entries) : [],
  }

  return (
    <div className="space-y-4">
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
          <DashboardContent data={optimisticData} timeframe="day" userId={user?.id} />
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <DashboardContent data={optimisticData} timeframe="week" userId={user?.id} />
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <DashboardContent data={optimisticData} timeframe="month" userId={user?.id} />
        </TabsContent>

        <TabsContent value="year" className="space-y-4">
          <DashboardContent data={optimisticData} timeframe="year" userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardContent({ data, timeframe, userId }: { data: any; timeframe: string; userId?: string }) {
  const { entries = [], goals = [], categories = [], stats = {} } = data
  const hasOptimisticEntries = entries.some((entry: any) => entry.__optimistic)

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <h3 className="text-3xl font-bold">
                {stats?.total_entries || entries.length || 0}
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
                {hasOptimisticEntries
                  ? entries.reduce((acc: number, entry: any) => acc + (entry.duration || 0), 0).toFixed(1)
                  : stats?.total_duration?.toFixed(1) || 0}
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
            <PieChart data={categories} entries={entries} />
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <RadialChart goals={goals} entries={entries} />
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
            <OptimisticTrackingHistory rawEntries={entries} categories={categories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Entry</CardTitle>
          </CardHeader>
          <CardContent>
            {userId ? (
              <OptimisticEntryForm categories={categories} userId={userId} />
            ) : (
              <div className="text-center py-4 text-gray-500">Please sign in to add entries</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
