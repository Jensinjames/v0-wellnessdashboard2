"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadialChart } from "./radial-chart"
import { PieChart } from "./pie-chart"
import { CategoryCard } from "./category-card"
import { DailyMetrics } from "./daily-metrics"
import { TrackingHistory } from "./tracking-history"
import { categoryColors, calculatePercentage } from "@/utils/chart-utils"

// Mock data for the dashboard
const mockData = {
  totalHours: 11.875,
  dailyCap: 7,
  categories: [
    {
      name: "Faith",
      value: 0.63, // 38 minutes
      goal: 1.5, // 1.5 hours
      color: categoryColors.faith.primary,
      description: "Daily prayer, meditation, scripture study",
    },
    {
      name: "Life",
      value: 1.2, // 1.2 hours
      goal: 4, // 4 hours
      color: categoryColors.life.primary,
      description: "Family time, social activities, hobbies",
    },
    {
      name: "Work",
      value: 2, // 2 hours
      goal: 7, // 7 hours
      color: categoryColors.work.primary,
      description: "Professional development, career goals",
    },
    {
      name: "Health",
      value: 8.05, // 8.05 hours
      goal: 19, // 19 hours
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

  // Calculate percentages for each category
  const categoriesWithPercentage = mockData.categories.map((category) => ({
    ...category,
    percentage: calculatePercentage(category.value, category.goal),
  }))

  // Calculate total percentage
  const totalPercentage = calculatePercentage(
    mockData.totalHours,
    mockData.categories.reduce((sum, cat) => sum + cat.goal, 0),
  )

  return (
    <div className="space-y-4">
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
              {mockData.totalHours} hours logged today
              {mockData.totalHours > mockData.dailyCap && (
                <span className="ml-1 text-amber-500">(exceeds daily cap of {mockData.dailyCap} hours)</span>
              )}
            </p>
          </div>

          {chartType === "radial" ? (
            <RadialChart data={mockData.categories} size={280} />
          ) : (
            <PieChart data={mockData.categories} size={280} />
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoriesWithPercentage.map((category) => (
              <CategoryCard
                key={category.name}
                title={category.name}
                actual={category.value}
                goal={category.goal}
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
          score={mockData.dailyMetrics.score}
          motivation={mockData.dailyMetrics.motivation}
          sleep={mockData.dailyMetrics.sleep}
        />
        <TrackingHistory entries={mockData.trackingHistory} />
      </div>
    </div>
  )
}
