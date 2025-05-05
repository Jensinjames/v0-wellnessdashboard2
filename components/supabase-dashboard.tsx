"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CategoryOverview } from "@/components/category-overview"
import { fetchWellnessCategories, fetchWellnessGoals, fetchWellnessEntries } from "@/services/wellness-service"
import { DEFAULT_CATEGORIES } from "@/types/wellness"
import { Skeleton } from "@/components/ui/skeleton"
import type { WellnessCategory, WellnessEntryData, WellnessGoal } from "@/types/wellness"

export function SupabaseDashboard() {
  const [date, setDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<WellnessCategory[]>([])
  const [goals, setGoals] = useState<WellnessGoal[]>([])
  const [entries, setEntries] = useState<WellnessEntryData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // Fetch data from Supabase
        const [categoriesData, goalsData, entriesData] = await Promise.all([
          fetchWellnessCategories(),
          fetchWellnessGoals(),
          fetchWellnessEntries(),
        ])

        // If we have categories from the database, use them
        if (categoriesData.length > 0) {
          // Merge with default metrics since we don't have metrics in the database yet
          const mergedCategories = categoriesData.map((dbCategory) => {
            const defaultCategory = DEFAULT_CATEGORIES.find((c) => c.name === dbCategory.name)
            return {
              ...dbCategory,
              metrics: defaultCategory?.metrics || [],
            }
          })

          setCategories(mergedCategories)
        } else {
          // Fallback to default categories
          setCategories(DEFAULT_CATEGORIES)
        }

        setGoals(goalsData)
        setEntries(entriesData)
      } catch (err) {
        console.error("Error loading wellness data:", err)
        setError("Failed to load wellness data. Please try again later.")

        // Fallback to default categories
        setCategories(DEFAULT_CATEGORIES)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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
          <h1 className="text-3xl font-bold tracking-tight">Wellness Dashboard</h1>
          <p className="text-muted-foreground">Track and visualize your wellness journey</p>
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
          <Button>
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
