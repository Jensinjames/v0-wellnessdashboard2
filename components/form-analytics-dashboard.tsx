"use client"

import { useState, useEffect } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getAllFormAnalytics, clearFormAnalytics, type FormAnalytics } from "@/services/form-analytics"

export function FormAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Record<string, FormAnalytics>>({})
  const [selectedFormId, setSelectedFormId] = useState<string>("")

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = () => {
      const data = getAllFormAnalytics()
      setAnalytics(data)

      // Set default selected form if none selected
      if (Object.keys(data).length > 0 && !selectedFormId) {
        setSelectedFormId(Object.keys(data)[0])
      }
    }

    loadAnalytics()

    // Refresh analytics every 5 seconds
    const interval = setInterval(loadAnalytics, 5000)
    return () => clearInterval(interval)
  }, [selectedFormId])

  // Handle form selection change
  const handleFormChange = (formId: string) => {
    setSelectedFormId(formId)
  }

  // Handle clearing analytics for the selected form
  const handleClearAnalytics = () => {
    if (selectedFormId) {
      clearFormAnalytics(selectedFormId)
      setAnalytics(getAllFormAnalytics())
    }
  }

  // Get the selected form's analytics
  const selectedFormAnalytics = selectedFormId ? analytics[selectedFormId] : null

  // Prepare data for charts
  const submissionData = selectedFormAnalytics
    ? [
        { name: "Successes", value: selectedFormAnalytics.successes, color: "#10b981" },
        { name: "Errors", value: selectedFormAnalytics.errors, color: "#ef4444" },
      ]
    : []

  const fieldErrorsData = selectedFormAnalytics
    ? Object.entries(selectedFormAnalytics.fieldErrors).map(([field, count]) => ({
        name: field,
        count,
      }))
    : []

  // Sort field errors by count (descending)
  fieldErrorsData.sort((a, b) => b.count - a.count)

  // Format success rate
  const formattedSuccessRate = selectedFormAnalytics ? `${selectedFormAnalytics.successRate.toFixed(1)}%` : "N/A"

  // Format average duration
  const formattedDuration = selectedFormAnalytics
    ? `${(selectedFormAnalytics.averageDuration / 1000).toFixed(2)}s`
    : "N/A"

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Form Analytics Dashboard</CardTitle>
        <CardDescription>Track form submission rates and validation errors to improve user experience</CardDescription>

        <div className="flex items-center justify-between mt-4">
          <Select value={selectedFormId} onValueChange={handleFormChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a form" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(analytics).map((formId) => (
                <SelectItem key={formId} value={formId}>
                  {formId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleClearAnalytics} disabled={!selectedFormId}>
            Clear Analytics
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!selectedFormAnalytics ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            {Object.keys(analytics).length === 0
              ? "No form analytics data available yet"
              : "Select a form to view analytics"}
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="errors">Field Errors</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedFormAnalytics.attempts}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formattedSuccessRate}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formattedDuration}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="h-[300px] mb-8">
                <h3 className="text-lg font-medium mb-2">Submission Results</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={submissionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {submissionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="errors">
              <div className="h-[400px]">
                <h3 className="text-lg font-medium mb-2">Field Validation Errors</h3>
                {fieldErrorsData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No field errors recorded
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      count: {
                        label: "Error Count",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[400px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fieldErrorsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="var(--color-count)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
