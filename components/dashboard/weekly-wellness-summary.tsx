"use client"

import { useWeeklyWellnessSummary } from "@/hooks/use-edge-functions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { formatDate } from "@/utils/date-utils"

export function WeeklyWellnessSummary() {
  const { data, error, loading } = useWeeklyWellnessSummary()

  // Group data by week
  const groupedByWeek = data.reduce(
    (acc, item) => {
      const weekStart = item.week_start
      if (!acc[weekStart]) {
        acc[weekStart] = []
      }
      acc[weekStart].push(item)
      return acc
    },
    {} as Record<string, typeof data>,
  )

  // Sort weeks in descending order
  const sortedWeeks = Object.keys(groupedByWeek).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-3/4" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-1/2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error loading weekly summary: {error}</AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Wellness Summary</CardTitle>
          <CardDescription>Track your wellness activities over time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            No wellness data available yet. Start tracking your activities to see insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Wellness Summary</CardTitle>
        <CardDescription>Your wellness activity trends over the past 4 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedWeeks.map((weekStart) => (
          <div key={weekStart} className="mb-8">
            <h3 className="text-lg font-medium mb-2">Week of {formatDate(new Date(weekStart))}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupedByWeek[weekStart]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="category" />
                  <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
                  <Tooltip formatter={(value, name) => [`${value} minutes`, name]} labelFormatter={() => ""} />
                  <Bar dataKey="total_duration" fill="#8884d8" name="Duration" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {groupedByWeek[weekStart].some((item) => item.insights) && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">AI Insights</h4>
                <ul className="space-y-2">
                  {groupedByWeek[weekStart]
                    .filter((item) => item.insights)
                    .map((item, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{item.category}:</span> {item.insights}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
