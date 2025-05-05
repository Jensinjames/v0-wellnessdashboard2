import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Activity, Brain, Clock, Heart } from "lucide-react"

export function DailyMetrics() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <MetricCard
        title="Daily Score"
        value="0%"
        description="Overall daily performance score"
        icon={<Activity className="h-5 w-5 text-white" />}
        color="bg-blue-500"
        trend="up"
        trendValue="+0%"
      />
      <MetricCard
        title="Motivation Level"
        value="0%"
        description="Average motivation level"
        icon={<Brain className="h-5 w-5 text-white" />}
        color="bg-purple-500"
        trend="neutral"
        trendValue="0%"
      />
      <MetricCard
        title="Sleep Duration"
        value="0h"
        description="Average sleep hours"
        icon={<Clock className="h-5 w-5 text-white" />}
        color="bg-blue-600"
        trend="down"
        trendValue="-0h"
      />
      <MetricCard
        title="Health Balance"
        value="0%"
        description="Overall health score"
        icon={<Heart className="h-5 w-5 text-white" />}
        color="bg-green-500"
        trend="up"
        trendValue="+0%"
      />
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  color: string
  trend: "up" | "down" | "neutral"
  trendValue: string
}

function MetricCard({ title, value, description, icon, color, trend, trendValue }: MetricCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={`rounded-md ${color} p-2`}>{icon}</div>
          <div className={`text-xs font-medium ${getTrendColor(trend)}`}>{trendValue}</div>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function getTrendColor(trend: "up" | "down" | "neutral") {
  switch (trend) {
    case "up":
      return "text-green-500"
    case "down":
      return "text-red-500"
    default:
      return "text-gray-500"
  }
}
