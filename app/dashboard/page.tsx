"use client"

import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useWellness } from "@/context/wellness-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Calendar, Plus, TrendingUp, Loader2, WifiOff, RefreshCw } from "lucide-react"
import { DailyMetrics } from "@/components/daily-metrics"
import { CategoryOverview } from "@/components/category-overview"
import { SyncStatus } from "@/components/sync-status"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSync } from "@/hooks/use-sync"

export default function Dashboard() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { categories, entries, isLoading: isDataLoading, error, isOffline, refreshData } = useWellness()
  const { syncData, isSyncing } = useSync()
  const [activeTab, setActiveTab] = useState("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/signin?redirect=/dashboard")
    }
  }, [user, isAuthLoading, router])

  // Refresh data when component mounts
  useEffect(() => {
    if (user) {
      refreshData()
    }
  }, [user, refreshData])

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshData()
    if (navigator.onLine) {
      await syncData()
    }
    setIsRefreshing(false)
  }

  // Show loading state
  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
      </div>
    )
  }

  // If not authenticated, this will redirect (see useEffect above)
  if (!user) {
    return null
  }

  // Get recent entries (last 5)
  const recentEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  // Get enabled categories
  const enabledCategories = categories.filter((cat) => cat.enabled)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.user_metadata?.full_name || user.email}! Here's an overview of your wellness journey.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing || isSyncing}
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing || isSyncing ? "animate-spin" : ""}`} />
          </Button>
          <Link href="/add-entry">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          </Link>
        </div>
      </div>

      {isOffline && (
        <Alert variant="warning" className="mb-4">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription>
            You're currently in offline mode. Your changes will be saved locally and synced when you're back online.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <SyncStatus />
      </div>

      <DailyMetrics />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
            <p className="text-xs text-muted-foreground">
              {entries.length > 0 ? `Last entry: ${new Date(entries[0].date).toLocaleDateString()}` : "No entries yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledCategories.length}</div>
            <p className="text-xs text-muted-foreground">Tracking across {enabledCategories.length} wellness areas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wellness Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entries.length > 5 ? "Positive" : entries.length > 0 ? "Getting Started" : "No Data"}
            </div>
            <p className="text-xs text-muted-foreground">Based on your recent entries</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="entries">Recent Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <CategoryOverview showGoals={true} showTimeAllocations={true} interactive={true} maxCategories={4} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryOverview
            showGoals={true}
            showTimeAllocations={true}
            showSubcategoryProgress={true}
            interactive={true}
            comparisonMode={true}
          />
        </TabsContent>

        <TabsContent value="entries" className="space-y-4">
          {entries.length > 0 ? (
            <div className="grid gap-4">
              {recentEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">{new Date(entry.date).toLocaleDateString()}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {entry.metrics.slice(0, 5).map((metric, idx) => {
                        const category = categories.find((c) => c.id === metric.categoryId)
                        const metricDef = category?.metrics.find((m) => m.id === metric.metricId)

                        return (
                          <Badge key={`${metric.categoryId}-${metric.metricId}-${idx}`} variant="outline">
                            {metricDef?.name || "Unknown"}: {metric.value} {metricDef?.unit || ""}
                          </Badge>
                        )
                      })}
                      {entry.metrics.length > 5 && <Badge variant="outline">+{entry.metrics.length - 5} more</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="mb-4">You haven't added any entries yet.</p>
                <Link href="/add-entry">
                  <Button>Add Your First Entry</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
