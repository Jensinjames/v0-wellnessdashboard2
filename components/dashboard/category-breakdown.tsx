"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface CategoryBreakdownProps {
  data: Record<string, number>
  isLoading: boolean
}

export function CategoryBreakdown({ data, isLoading }: CategoryBreakdownProps) {
  // Transform data for the chart
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value: Number.parseFloat(value.toFixed(1)),
  }))

  // Colors for the pie chart
  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
    "hsl(var(--muted))",
    "hsl(var(--card))",
  ]

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-3">
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px]">
        <p className="text-muted-foreground">No category data available</p>
      </div>
    )
  }

  return (
    <Card className="p-4">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} hours`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
