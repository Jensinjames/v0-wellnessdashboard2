import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface CategoryCardProps {
  category: string
  value: number
  max: number
  color?: string
}

export function CategoryCard({ category, value, max, color = "#3b82f6" }: CategoryCardProps) {
  const percentage = Math.min(100, Math.round((value / max) * 100))

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">{category}</h3>
          <span className="text-sm text-muted-foreground">
            {value}/{max} hrs
          </span>
        </div>
        <Progress
          value={percentage}
          className="h-2"
          style={
            {
              "--progress-background": color,
            } as React.CSSProperties
          }
        />
      </CardContent>
    </Card>
  )
}
