"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RealtimeStatus } from "@/components/ui/realtime-status"
import { useRealtimeGoals } from "@/hooks/use-realtime-goals"
import { getCurrentUser } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/database"

type Goal = Database["public"]["Tables"]["goals"]["Row"]

interface GoalProgressRealtimeProps {
  categoryId?: string
  className?: string
}

export function GoalProgressRealtime({ categoryId, className }: GoalProgressRealtimeProps) {
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    async function fetchUser() {
      const user = await getCurrentUser()
      setUserId(user?.id || null)
    }

    fetchUser()
  }, [])

  // Get goals with real-time updates
  const [goals, isLoading, error] = useRealtimeGoals(userId || "", categoryId)

  // Calculate progress (this is a placeholder - you would need to implement actual progress calculation)
  const calculateProgress = (goal: Goal): number => {
    // This is a simplified example - you would need to implement actual progress calculation
    // based on entries for this goal's category
    return Math.floor(Math.random() * 100)
  }

  // Get progress color based on percentage
  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return "bg-green-500"
    if (progress >= 75) return "bg-emerald-500"
    if (progress >= 50) return "bg-blue-500"
    if (progress >= 25) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Goal Progress</h2>
        {userId && <RealtimeStatus isConnected={!error} />}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateProgress(goal)
            return (
              <Card key={goal.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">
                    {goal.timeframe.charAt(0).toUpperCase() + goal.timeframe.slice(1)} Goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Target: {goal.target_duration} minutes</span>
                    <span>
                      {format(new Date(goal.start_date), "MMM d")} -
                      {goal.end_date ? format(new Date(goal.end_date), " MMM d") : " Ongoing"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" indicatorClassName={getProgressColor(progress)} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No goals found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {categoryId ? "Set goals for this category to track your progress" : "Set goals to track your progress"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
