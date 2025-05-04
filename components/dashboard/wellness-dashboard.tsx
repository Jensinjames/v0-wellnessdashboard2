"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WellnessDistribution } from "@/components/dashboard/wellness-distribution"
import { CategoryProgress } from "@/components/dashboard/category-progress"
import { TrackingHistory } from "@/components/dashboard/tracking-history"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useWellnessMetrics } from "@/context/wellness-metrics-context"
import { useAuth } from "@/context/auth-context"
import { AddEntryDialog } from "@/components/dashboard/add-entry-dialog"

export function WellnessDashboard() {
  const { profile } = useAuth()
  const { metrics, isLoading, error } = useWellnessMetrics()
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)

  if (isLoading) {
    return <p>Loading your wellness data...</p>
  }

  if (error) {
    return <p className="text-red-500">Error loading wellness data: {error}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Welcome, {profile?.full_name || "there"}!</h2>
        <Button onClick={() => setIsAddEntryOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>Add Entry</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Wellness Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="radial">
              <TabsList className="mb-4">
                <TabsTrigger value="radial">Radial View</TabsTrigger>
                <TabsTrigger value="pie">Pie Chart</TabsTrigger>
              </TabsList>
              <TabsContent value="radial">
                <WellnessDistribution view="radial" />
              </TabsContent>
              <TabsContent value="pie">
                <WellnessDistribution view="pie" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <CategoryProgress category="faith" />
              <CategoryProgress category="life" />
              <CategoryProgress category="work" />
              <CategoryProgress category="health" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracking History</CardTitle>
        </CardHeader>
        <CardContent>
          <TrackingHistory />
        </CardContent>
      </Card>

      <AddEntryDialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen} />
    </div>
  )
}
