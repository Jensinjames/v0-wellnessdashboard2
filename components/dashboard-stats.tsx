"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Calendar, TrendingUp, Users } from "lucide-react"

export function DashboardStats() {
  const [timeframe, setTimeframe] = useState("week")

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Your wellness metrics at a glance</CardDescription>
          </div>
          <Tabs value={timeframe} onValueChange={setTimeframe} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Activity Score"
            value="87%"
            description="↑ 12% from last period"
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            timeframe={timeframe}
          />
          <StatCard
            title="Entries"
            value="24"
            description="↑ 8 more than last period"
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            timeframe={timeframe}
          />
          <StatCard
            title="Goal Progress"
            value="68%"
            description="↑ 5% from last period"
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            timeframe={timeframe}
          />
          <StatCard
            title="Social Score"
            value="72%"
            description="↓ 3% from last period"
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            timeframe={timeframe}
            trend="down"
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  timeframe: string
  trend?: "up" | "down" | "neutral"
}

function StatCard({ title, value, description, icon, timeframe, trend = "up" }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p
          className={`text-xs ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}
        >
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
