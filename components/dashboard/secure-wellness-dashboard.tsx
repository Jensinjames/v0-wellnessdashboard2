"use client"

import { useState } from "react"
import { useWellnessData } from "@/hooks/use-wellness-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { categoryColors } from "@/utils/chart-utils"
import { AddEntryForm } from "./add-entry-form"

export function SecureWellnessDashboard() {
  const { entries, goals, categories, loading, error } = useWellnessData()
  const [isAddingEntry, setIsAddingEntry] = useState(false)

  // Calculate total hours per category
  const categoryTotals = entries.reduce(
    (acc, entry) => {
      const category = entry.category
      const hours = entry.duration / 60 // Convert minutes to hours
      acc[category] = (acc[category] || 0) + hours
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate progress towards goals
  const goalProgress = goals.map((goal) => {
    const categoryTotal = categoryTotals[goal.category] || 0
    const progress = Math.min(100, (categoryTotal / goal.goal_hours) * 100)

    // Find category details
    const categoryDetail = categories.find((c) => c.id === goal.category)

    return {
      ...goal,
      current: categoryTotal,
      progress,
      name: categoryDetail?.name || goal.category,
      color: categoryDetail?.color || categoryColors.faith.primary,
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading your wellness data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Wellness Dashboard</CardTitle>
            <CardDescription>Track your progress across wellness categories</CardDescription>
          </div>
          <Button onClick={() => setIsAddingEntry(true)} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Entry
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Goals Progress */}
            <div>
              <h3 className="mb-3 text-lg font-medium">Goal Progress</h3>
              {goalProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">No goals set yet. Add goals to track your progress.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {goalProgress.map((goal) => (
                    <Card key={goal.id} className="overflow-hidden">
                      <div className="h-1" style={{ backgroundColor: goal.color }}></div>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: goal.color }}></div>
                              <span className="font-medium">{goal.name}</span>
                            </div>
                            <span className="text-sm">{goal.progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{goal.current.toFixed(1)} hours</span>
                            <span>Goal: {goal.goal_hours} hours</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Entries */}
            <div>
              <h3 className="mb-3 text-lg font-medium">Recent Entries</h3>
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No entries yet. Start tracking your wellness activities.
                </p>
              ) : (
                <div className="space-y-4">
                  {entries.slice(0, 5).map((entry) => {
                    const categoryDetail = categories.find((c) => c.id === entry.category)
                    const color = categoryDetail?.color || categoryColors.faith.primary

                    return (
                      <Card key={entry.id} className="overflow-hidden">
                        <div className="h-1" style={{ backgroundColor: color }}></div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color }}></div>
                              <span className="font-medium">{entry.activity}</span>
                              <span className="text-sm text-muted-foreground">
                                ({categoryDetail?.name || entry.category})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{(entry.duration / 60).toFixed(1)} hours</span>
                            </div>
                          </div>
                          {entry.notes && <p className="mt-2 text-sm text-muted-foreground">{entry.notes}</p>}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Entry Form Dialog */}
      {isAddingEntry && <AddEntryForm open={isAddingEntry} onClose={() => setIsAddingEntry(false)} />}
    </div>
  )
}
