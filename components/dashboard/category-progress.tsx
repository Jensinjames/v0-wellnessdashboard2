"use client"

import { useWellnessMetrics, type WellnessCategory } from "@/context/wellness-metrics-context"
import { Progress } from "@/components/ui/progress"

type CategoryProgressProps = {
  category: WellnessCategory
}

const categoryLabels: Record<WellnessCategory, string> = {
  faith: "Faith",
  life: "Life",
  work: "Work",
  health: "Health",
}

const categoryColors: Record<WellnessCategory, string> = {
  faith: "bg-purple-500",
  life: "bg-green-500",
  work: "bg-yellow-500",
  health: "bg-orange-500",
}

export function CategoryProgress({ category }: CategoryProgressProps) {
  const { metrics } = useWellnessMetrics()

  const percentage = metrics.percentages[category]
  const totalHours = metrics.totalHours[category]
  const goalHours = metrics.goalHours[category]

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="font-medium">{categoryLabels[category]}</div>
        <div className="text-sm text-muted-foreground">
          {percentage.toFixed(0)}% ({totalHours.toFixed(1)} / {goalHours} hrs)
        </div>
      </div>
      <Progress value={percentage} className="h-2" indicatorClassName={categoryColors[category]} />
    </div>
  )
}
