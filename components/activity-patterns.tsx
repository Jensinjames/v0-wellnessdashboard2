"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

// Sample data - in a real app, this would come from your data source
const activityData = [
  { day: "Mon", morning: 4, afternoon: 3, evening: 2, night: 1 },
  { day: "Tue", morning: 3, afternoon: 5, evening: 2, night: 0 },
  { day: "Wed", morning: 2, afternoon: 4, evening: 3, night: 1 },
  { day: "Thu", morning: 5, afternoon: 2, evening: 4, night: 0 },
  { day: "Fri", morning: 3, afternoon: 3, evening: 5, night: 2 },
  { day: "Sat", morning: 1, afternoon: 4, evening: 6, night: 3 },
  { day: "Sun", morning: 2, afternoon: 5, evening: 4, night: 1 },
]

const timeBlocks = [
  { id: "morning", name: "Morning (5am-12pm)", color: "#22d3ee" },
  { id: "afternoon", name: "Afternoon (12pm-5pm)", color: "#a78bfa" },
  { id: "evening", name: "Evening (5pm-10pm)", color: "#f97316" },
  { id: "night", name: "Night (10pm-5am)", color: "#64748b" },
]

const categoryData = [
  { name: "Work", value: 35, color: "#ef4444" },
  { name: "Exercise", value: 20, color: "#22c55e" },
  { name: "Family", value: 15, color: "#3b82f6" },
  { name: "Learning", value: 10, color: "#a855f7" },
  { name: "Leisure", value: 15, color: "#eab308" },
  { name: "Other", value: 5, color: "#64748b" },
]

const weeklyData = [
  { week: "Week 1", work: 30, exercise: 15, family: 20, learning: 10, leisure: 20, other: 5 },
  { week: "Week 2", work: 35, exercise: 20, family: 15, learning: 15, leisure: 10, other: 5 },
  { week: "Week 3", work: 25, exercise: 25, family: 20, learning: 10, leisure: 15, other: 5 },
  { week: "Week 4", work: 30, exercise: 20, family: 25, learning: 5, leisure: 15, other: 5 },
]

const categoryColors = {
  work: "#ef4444",
  exercise: "#22c55e",
  family: "#3b82f6",
  learning: "#a855f7",
  leisure: "#eab308",
  other: "#64748b",
}

export function ActivityPatterns() {
  const [timeRange, setTimeRange] = useState("daily")
  const [activeTab, setActiveTab] = useState("timeOfDay")

  // Custom tooltip for time of day chart
  const TimeOfDayTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 rounded-md shadow-md border border-border text-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.fill }}>
              {entry.name}: {entry.value} hours
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom tooltip for category distribution chart
  const CategoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background p-3 rounded-md shadow-md border border-border text-sm">
          <p className="font-medium">{data.name}</p>
          <p style={{ color: data.color }}>
            {data.value}% ({Math.round((data.value / 100) * 40)} hours/week)
          </p>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for weekly trends chart
  const WeeklyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 rounded-md shadow-md border border-border text-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.fill }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Activity Patterns</CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4">
            <TabsList className="w-full justify-start rounded-none border-b-0 p-0">
              <TabsTrigger
                value="timeOfDay"
                className="relative rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Time of Day
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="relative rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Categories
              </TabsTrigger>
              <TabsTrigger
                value="weekly"
                className="relative rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Weekly Trends
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Time of Day Tab */}
          <TabsContent value="timeOfDay" className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<TimeOfDayTooltip />} />
                  {timeBlocks.map((block) => (
                    <Bar key={block.id} dataKey={block.id} stackId="a" fill={block.color} name={block.name} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              {timeBlocks.map((block) => (
                <div key={block.id} className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: block.color }} />
                  <span className="text-xs text-muted-foreground">{block.name}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip content={<CategoryTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Percentage of time spent on each category (based on a 40-hour week)</p>
            </div>
          </TabsContent>

          {/* Weekly Trends Tab */}
          <TabsContent value="weekly" className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<WeeklyTooltip />} />
                  {Object.entries(categoryColors).map(([key, color]) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="a"
                      fill={color}
                      name={key.charAt(0).toUpperCase() + key.slice(1)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              {Object.entries(categoryColors).map(([key, color]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-xs text-muted-foreground">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
