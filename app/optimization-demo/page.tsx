"use client"

import { useState } from "react"
import { OptimizationDemo } from "@/components/optimization-demo"
import { PerformanceProfiler } from "@/lib/profiler-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function OptimizationDemoPage() {
  const [showProfiler, setShowProfiler] = useState(false)

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">React Optimization Techniques</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Performance Tools</span>
            <Button variant="outline" size="sm" onClick={() => setShowProfiler(!showProfiler)}>
              {showProfiler ? "Hide Profiler" : "Show Profiler"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page demonstrates various techniques for optimizing React components and state management. Open your
            browser console to see render metrics and performance data.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="demo">
        <TabsList className="mb-4">
          <TabsTrigger value="demo">Demo</TabsTrigger>
          <TabsTrigger value="explanation">Explanation</TabsTrigger>
        </TabsList>

        <TabsContent value="demo">
          {showProfiler ? (
            <PerformanceProfiler id="optimization-demo">
              <OptimizationDemo />
            </PerformanceProfiler>
          ) : (
            <OptimizationDemo />
          )}
        </TabsContent>

        <TabsContent value="explanation">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Techniques Explained</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">1. Component Memoization</h3>
                <p className="text-muted-foreground">
                  Using React.memo and custom deepMemo to prevent unnecessary re-renders when props don't change.
                </p>
              </div>

              <div>
                <h3 className="font-medium">2. State Splitting</h3>
                <p className="text-muted-foreground">
                  Breaking down state into smaller pieces with individual setters to prevent re-renders when unrelated
                  state changes.
                </p>
              </div>

              <div>
                <h3 className="font-medium">3. Context Optimization</h3>
                <p className="text-muted-foreground">
                  Using context selectors to only re-render when specific parts of context change.
                </p>
              </div>

              <div>
                <h3 className="font-medium">4. Callback Memoization</h3>
                <p className="text-muted-foreground">
                  Using enhanced versions of useCallback to ensure stable function references.
                </p>
              </div>

              <div>
                <h3 className="font-medium">5. Performance Monitoring</h3>
                <p className="text-muted-foreground">
                  Using custom hooks and components to track render counts and durations.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
