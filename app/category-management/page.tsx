"use client"

import { OptimizedCategoryManagement } from "@/components/optimized-category-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { WellnessProvider } from "@/context/wellness-context"

export default function CategoryManagementPage() {
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false)

  // Sample performance data - in a real app, this would come from actual measurements
  const performanceData = [
    { name: "Original", categoryLoad: 120, metricRender: 85, filterOperation: 45, totalTime: 250 },
    { name: "Optimized", categoryLoad: 35, metricRender: 22, filterOperation: 12, totalTime: 69 },
  ]

  return (
    <WellnessProvider>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground">
            Manage your wellness categories and metrics with optimized performance
          </p>
        </div>

        <Tabs defaultValue="categories">
          <TabsList>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-6">
            <OptimizedCategoryManagement />
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>Comparing the original implementation with the optimized version</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: "Time (ms)", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Bar dataKey="categoryLoad" name="Category Loading" fill="#8884d8" />
                      <Bar dataKey="metricRender" name="Metric Rendering" fill="#82ca9d" />
                      <Bar dataKey="filterOperation" name="Filter Operation" fill="#ffc658" />
                      <Bar dataKey="totalTime" name="Total Time" fill="#ff8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-medium">Optimization Techniques Applied</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Virtualized rendering for large category lists</li>
                    <li>Memoized components to prevent unnecessary re-renders</li>
                    <li>Optimized data structures (Maps and Sets) for O(1) lookups</li>
                    <li>Fine-grained context selectors to minimize re-renders</li>
                    <li>Batch updates for multiple operations</li>
                    <li>Transition API for improved UI responsiveness</li>
                    <li>Performance monitoring and metrics collection</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </WellnessProvider>
  )
}
