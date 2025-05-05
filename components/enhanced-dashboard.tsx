"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Plus } from "lucide-react"
import { DashboardStats } from "@/components/dashboard-stats"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

export function EnhancedDashboard() {
  const [date, setDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6 pt-4">
          <DashboardStats />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
                <CardDescription>Your latest wellness data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Placeholder for recent entries */}
                  <p className="text-sm text-muted-foreground">No entries found for the selected date.</p>
                  <Button variant="outline" className="w-full">
                    View All Entries
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>How you're doing across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Placeholder for category performance */}
                  <p className="text-sm text-muted-foreground">Connect your categories to see performance metrics.</p>
                  <Button variant="outline" className="w-full">
                    Manage Categories
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goal Tracking</CardTitle>
                <CardDescription>Progress toward your wellness goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Placeholder for goal tracking */}
                  <p className="text-sm text-muted-foreground">Set up goals to track your progress.</p>
                  <Button variant="outline" className="w-full">
                    Set Goals
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Detailed view of each wellness category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Connect your categories to see detailed analytics.</p>
                <Button className="mt-4">Connect Categories</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Goal Progress</CardTitle>
              <CardDescription>Track your progress toward wellness goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Set up goals to track your progress over time.</p>
                <Button className="mt-4">Set Up Goals</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
