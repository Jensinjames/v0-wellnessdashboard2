"use client"

import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface WellnessInsightsChartProps {
  insights: any
}

export function WellnessInsightsChart({ insights }: WellnessInsightsChartProps) {
  // Extract data from insights
  const goalProgress = insights?.goal_progress || {}

  // Transform data for the chart
  const chartData = Object.entries(goalProgress).map(([category, progress]: [string, any]) => ({
    category,
    actual: progress.actual || 0,
    target: progress.target || 0,
    percentage: progress.percentage || 0,
  }))

  return (
    <Card className="p-4">
      <ChartContainer
        config={{
          actual: {
            label: "Actual Hours",
            color: "hsl(var(--chart-1))",
          },
          target: {
            label: "Target Hours",
            color: "hsl(var(--chart-2))",
          },
        }}
        className="h-[300px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="var(--color-actual)"
              activeDot={{ r: 8 }}
              name="Actual Hours"
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="var(--color-target)"
              strokeDasharray="5 5"
              name="Target Hours"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  )
}
