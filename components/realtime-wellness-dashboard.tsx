"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CategoryOverview } from "@/components/category-overview"
import { useRealtimeWellness } from "@/context/realtime-wellness-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export function RealtimeWellnessDashboard() {
  const router = useRouter()
  const [date, setDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("overview")
  const { categories, goals, entries, loading, error } = useRealtimeWellness()

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Wellness Dashboard</h1>
            <Badge variant="outline" className="ml-2">
              Real-time
            </Badge>
          </div>
          <p className="text-muted-foreground">Track and visualize your wellness journey with live updates</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
          <Button onClick={() => router.push("/add-entry")}>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Progress</CardTitle>
              <CardDescription>Your wellness metrics for {format(date, "MMMM d, yyyy")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-700 dark:text-green-300 flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Live updates enabled - changes will appear in real-time
                </p>
              </div>
              <CategoryOverview showGoals={true} showTimeAllocations={true} interactive={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
              <CardDescription>Detailed view of each wellness category</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryOverview
                showGoals={true}
                showTimeAllocations={true}
                showSubcategoryProgress={true}
                interactive={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Comparison</CardTitle>
              <CardDescription>Compare metrics across different wellness categories</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryOverview comparisonMode={true} interactive={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-[250px] mb-2" />
          <Skeleton className="h-5 w-[300px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-[240px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-[400px]" />

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="p-4">
                      <Skeleton className="h-5 w-[100px]" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Skeleton className="h-20 w-full mb-4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4 mt-2" />
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
