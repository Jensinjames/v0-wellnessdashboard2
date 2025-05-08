"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getDashboardData } from "@/utils/supabase-functions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart } from "@/components/dashboard/pie-chart"
import { RadialChart } from "@/components/dashboard/radial-chart"
import { TrackingHistory } from "@/components/dashboard/tracking-history"
import { AddEntryForm } from "@/components/dashboard/add-entry-form"
import { LoadingAnimation } from "@/components/ui/loading-animation"

export function WellnessDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "year">("week")
  const [error, setError] = useState<string | null>(null)

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

  const { entries, goals, categories, stats } = dashboardData

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
          <DashboardContent data={dashboardData} timeframe="day" />
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <DashboardContent data={dashboardData} timeframe="week" />
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <DashboardContent data={dashboardData} timeframe="month" />
        </TabsContent>

        <TabsContent value="year" className="space-y-4">
          <DashboardContent data={dashboardData} timeframe="year" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardContent({ data, timeframe }: { data: any; timeframe: string }) {
  const { entries, goals, categories, stats } = data

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <h3 className="text-3xl font-bold">{stats?.total_entries || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <h3 className="text-3xl font-bold">{stats?.total_duration?.toFixed(1) || 0}</h3>
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
            <TrackingHistory entries={entries} categories={categories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <AddEntryForm categories={categories} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
