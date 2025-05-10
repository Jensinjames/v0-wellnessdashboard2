import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatTime, formatPercentage } from "@/utils/chart-utils"

interface CategoryCardProps {
  title: string
  actual: number
  goal: number
  percentage: number
  color: string
  description?: string
}

export function CategoryCard({ title, actual, goal, percentage, color, description }: CategoryCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1" style={{ backgroundColor: color }}></div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <span className="text-sm font-bold" style={{ color }}>
            {formatPercentage(percentage)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="h-2 mb-2" indicatorColor={color} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(actual)}</span>
          <span>Goal: {formatTime(goal)}</span>
        </div>
        {description && <p className="mt-2 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}
