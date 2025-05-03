"use client"

import { useState } from "react"
import { useOptimizedWellness } from "@/hooks/use-optimized-wellness"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function NormalizedDataDemo() {
  const wellness = useOptimizedWellness()
  const { normalizedData } = wellness

  const [performanceResults, setPerformanceResults] = useState<any>(null)
  const [lookupTimes, setLookupTimes] = useState<{
    normalized: number
    denormalized: number
  }>({ normalized: 0, denormalized: 0 })

  // Run performance test
  const runPerformanceTest = () => {
    // Clear previous metrics
    wellness.clearPerformanceMetrics()

    // Test normalized lookup (by ID)
    const normalizedStart = performance.now()
    for (let i = 0; i < 1000; i++) {
      // Get random category ID
      const randomIndex = Math.floor(Math.random() * normalizedData.categories.allIds.length)
      const randomId = normalizedData.categories.allIds[randomIndex]

      // Lookup by ID (O(1) operation)
      const category = normalizedData.categories.byId[randomId]
    }
    const normalizedEnd = performance.now()

    // Test denormalized lookup (by iterating array)
    const denormalizedStart = performance.now()
    for (let i = 0; i < 1000; i++) {
      // Get random index
      const randomIndex = Math.floor(Math.random() * wellness.categories.length)
      const randomId = wellness.categories[randomIndex].id

      // Lookup by ID (O(n) operation)
      const category = wellness.categories.find((c) => c.id === randomId)
    }
    const denormalizedEnd = performance.now()

    // Set results
    setLookupTimes({
      normalized: normalizedEnd - normalizedStart,
      denormalized: denormalizedEnd - denormalizedStart,
    })

    // Get all performance metrics
    setPerformanceResults(wellness.getPerformanceMetrics())
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Normalized Data Structure Demo</CardTitle>
          <CardDescription>Compare performance between normalized and denormalized data structures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium">Normalized Structure</h3>
                <pre className="mt-2 rounded bg-slate-100 p-2 text-sm">
                  {JSON.stringify(
                    {
                      categoriesCount: normalizedData.categories.allIds.length,
                      goalsCount: normalizedData.goals.allIds.length,
                      entriesCount: normalizedData.entries.allIds.length,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
              <div>
                <h3 className="text-lg font-medium">Indexes</h3>
                <pre className="mt-2 rounded bg-slate-100 p-2 text-sm">
                  {JSON.stringify(
                    {
                      enabledCategoriesCount: normalizedData.indexes.enabledCategoryIds.size,
                      dateIndexCount: normalizedData.indexes.entriesByDate.size,
                      categoryIndexCount: normalizedData.indexes.entriesByCategoryId.size,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>

            <Button onClick={runPerformanceTest}>Run Performance Test</Button>

            {lookupTimes.normalized > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium">Lookup Performance (1000 operations)</h3>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{lookupTimes.normalized.toFixed(2)}ms</div>
                      <p className="text-sm text-muted-foreground">Normalized (O(1) lookup)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{lookupTimes.denormalized.toFixed(2)}ms</div>
                      <p className="text-sm text-muted-foreground">Denormalized (O(n) lookup)</p>
                    </CardContent>
                  </Card>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Speedup: {(lookupTimes.denormalized / lookupTimes.normalized).toFixed(2)}x faster
                </p>
              </div>
            )}

            {performanceResults && (
              <div className="mt-4">
                <h3 className="text-lg font-medium">Other Performance Metrics</h3>
                <pre className="mt-2 rounded bg-slate-100 p-2 text-sm">
                  {JSON.stringify(performanceResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
