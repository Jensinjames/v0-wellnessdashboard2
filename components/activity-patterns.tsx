"use client"

import { useState, useId } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getActivityTimeData,
  getCategoryDistribution,
  getTimeOfDayDistribution,
  getStreakData,
  getHeatmapData,
  getActivityCorrelationData,
} from "@/utils/activity-chart-utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useScreenReaderAnnouncer } from "@/components/accessibility/screen-reader-announcer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface Activity {
  id: string
  categoryId: string
  categoryName: string
  subcategoryId: string
  subcategoryName: string
  date: Date | string
  duration: number
  value: number
}

interface ActivityPatternsProps {
  activities: Activity[]
}

export function ActivityPatterns({ activities }: ActivityPatternsProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"frequency" | "duration" | "value">("frequency")
  const [timeFrame, setTimeFrame] = useState<"week" | "month" | "year">("month")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isSmallMobile = useMediaQuery("(max-width: 480px)")
  const { announce } = useScreenReaderAnnouncer()

  // Generate unique IDs
  const baseId = useId().replace(/:/g, "-")
  const categorySelectId = `${baseId}-category-select`
  const timeFrameSelectId = `${baseId}-timeframe-select`
  const viewModeButtonsId = `${baseId}-viewmode-buttons`

  // Get data based on selected filters
  const activityTimeData = getActivityTimeData(timeFrame, selectedCategory, viewMode)
  const categoryData = getCategoryDistribution(timeFrame, selectedCategory)
  const timeOfDayData = getTimeOfDayDistribution(timeFrame, selectedCategory)
  const streakData = getStreakData(selectedCategory)
  const heatmapData = getHeatmapData(timeFrame, selectedCategory)
  const correlationData = getActivityCorrelationData(selectedCategory)

  // Format value based on view mode
  const formatValue = (value: number) => {
    if (viewMode === "duration") {
      const hours = Math.floor(value / 60)
      const minutes = value % 60
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    } else if (viewMode === "value") {
      return value.toFixed(1)
    }
    return value.toString()
  }

  // Get label based on view mode
  const getYAxisLabel = () => {
    if (viewMode === "frequency") return "Frequency"
    if (viewMode === "duration") return "Duration (min)"
    return "Value"
  }

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    announce(`Category changed to ${value === "all" ? "All Categories" : value}`, "polite")
  }

  // Handle time frame change
  const handleTimeFrameChange = (value: "week" | "month" | "year") => {
    setTimeFrame(value)
    const timeFrameLabels = { week: "This Week", month: "This Month", year: "This Year" }
    announce(`Time frame changed to ${timeFrameLabels[value]}`, "polite")
  }

  // Handle view mode change
  const handleViewModeChange = (mode: "frequency" | "duration" | "value") => {
    setViewMode(mode)
    announce(`View mode changed to ${mode}`, "polite")
  }

  const uniqueId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                {activities.length === 0 ? (
                  <p>No activities recorded yet. Start tracking to see patterns.</p>
                ) : (
                  <p>You have recorded {activities.length} activities.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p>Trend analysis will appear here as you record more activities.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p>Insights will be generated as you continue to track your activities.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
