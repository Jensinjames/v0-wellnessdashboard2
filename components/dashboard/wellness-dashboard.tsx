"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadialChart } from "./radial-chart"
import { PieChart } from "./pie-chart"
import { CategoryCard } from "./category-card"
import { DailyMetrics } from "./daily-metrics"
import { TrackingHistory } from "./tracking-history"
import { categoryColors, calculatePercentage } from "@/utils/chart-utils"
import { useAuth } from "@/context/auth-context"
import { setCacheItem, getCacheItem, CACHE_KEYS, CACHE_EXPIRY } from "@/lib/cache-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

// Mock data for the dashboard
const mockData = {
  totalHours: 11.875,
  dailyCap: 7,
  categories: [
    {
      name: "Faith",
      value: 0.63, // 38 minutes
      goal_hours: 1.5, // 1.5 hours
      color: categoryColors.faith.primary,
      description: "Daily prayer, meditation, scripture study",
    },
    {
      name: "Life",
      value: 1.2, // 1.2 hours
      goal_hours: 4, // 4 hours
      color: categoryColors.life.primary,
      description: "Family time, social activities, hobbies",
    },
    {
      name: "Work",
      value: 2, // 2 hours
      goal_hours: 7, // 7 hours
      color: categoryColors.work.primary,
      description: "Professional development, career goals",
    },
    {
      name: "Health",
      value: 8.05, // 8.05 hours
      goal_hours: 19, // 19 hours
      color: categoryColors.health.primary,
      description: "Exercise, sleep, nutrition, mental health",
    },
  ],
  dailyMetrics: {
    score: 65,
    motivation: 70,
    sleep: 7.5,
  },
  trackingHistory: [
    {
      id: "1",
      category: "Health",
      duration: 7,
      timestamp: new Date().toISOString(),
      color: categoryColors.health.primary,
    },
    {
      id: "2",
      category: "Faith",
      duration: 0.5,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      color: categoryColors.faith.primary,
    },
    {
      id: "3",
      category: "Work",
      duration: 2,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      color: categoryColors.work.primary,
    },
  ],
}

export function WellnessDashboard() {
  const [chartType, setChartType] = useState<"radial" | "pie">("radial")
  const [dashboardData, setDashboardData] = useState(mockData)
  const [isCached, setIsCached] = useState(false)
  const { user } = useAuth()

  // Load cached dashboard data on mount
  useEffect(() => {
    if (user) {
      const cacheKey = CACHE_KEYS.DASHBOARD_DATA(user.id)
      const cachedData = getCacheItem<typeof mockData>(cacheKey)

      if (cachedData) {
        setDashboardData(cachedData)
        setIsCached(true)
      } else {
        // Cache the initial mock data
        setCacheItem(cacheKey, mockData, CACHE_EXPIRY.SHORT)
      }
    }
  }, [user])

  // Update the categories array to use goal_hours instead of goal
  const categoriesWithPercentage = dashboardData.categories.map((category) => ({
    ...category,
    percentage: calculatePercentage(category.value, category.goal_hours),
  }))

  // Calculate total percentage
  const totalPercentage = calculatePercentage(
    dashboardData.totalHours,
    dashboardData.categories.reduce((sum, cat) => sum + cat.goal_hours, 0),
  )

  return (
    <div className="space-y-4">
      {isCached && (
        <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Cached Data</AlertTitle>
          <AlertDescription>You're viewing cached dashboard data for better performance.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Wellness Distribution</CardTitle>
              <CardDescription>{totalPercentage}% Goal Completion for today</CardDescription>
            </div>
            <div className="mt-2 sm:mt-0">
              <Tabs defaultValue={chartType} onValueChange={(v) => setChartType(v as "radial" | "pie")}>
                <TabsList>
                  <TabsTrigger value="pie">Pie Chart</TabsTrigger>
                  <TabsTrigger value="radial">Radial View</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-center text-sm text-muted-foreground">
            <p>
              {dashboardData.totalHours} hours logged today
              {dashboardData.totalHours > dashboardData.dailyCap && (
                <span className="ml-1 text-amber-500">(exceeds daily cap of {dashboardData.dailyCap} hours)</span>
              )}
            </p>
          </div>

          {chartType === "radial" ? (
            <RadialChart data={dashboardData.categories} size={280} />
          ) : (
            <PieChart data={dashboardData.categories} size={280} />
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoriesWithPercentage.map((category) => (
              <CategoryCard
                key={category.name}
                title={category.name}
                actual={category.value}
                goal={category.goal_hours}
                percentage={category.percentage}
                color={category.color}
                description={category.description}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <DailyMetrics
          score={dashboardData.dailyMetrics.score}
          motivation={dashboardData.dailyMetrics.motivation}
          sleep={dashboardData.dailyMetrics.sleep}
        />
        <TrackingHistory entries={dashboardData.trackingHistory} />
      </div>
    </div>
  )
}
