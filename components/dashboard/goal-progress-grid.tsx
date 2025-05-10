"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle } from "lucide-react"

interface GoalProgressGridProps {
  goals: any[]
  insights: any
  isLoading: boolean
}

export function GoalProgressGrid({ goals, insights, isLoading }: GoalProgressGridProps) {
  const goalProgress = insights?.goal_progress || {}

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-6 w-2/3 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-2 w-full mb-2" />
              <div className="flex justify-between mt-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px]">
        <p className="text-muted-foreground">No goals set yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {goals.map((goal) => {
        const progress = goalProgress[goal.category] || { percentage: 0, actual: 0, target: goal.goal_hours }
        const percentage = Math.min(Math.round(progress.percentage * 100), 100)
        const isCompleted = percentage >= 100

        return (
          <Card key={goal.id} className={isCompleted ? "border-green-500" : ""}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{goal.category}</h3>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  percentage < 25 && <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
              </div>

              <Progress value={percentage} className="h-2 mb-2" />

              <div className="flex justify-between mt-2 text-sm">
                <span>{progress.actual} hours</span>
                <span className="text-muted-foreground">Goal: {goal.goal_hours} hours</span>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <Badge variant={isCompleted ? "success" : "outline"}>{percentage}% Complete</Badge>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
