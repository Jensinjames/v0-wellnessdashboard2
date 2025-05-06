import type React from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatMinutes } from "@/utils/wellness-utils"
import type { LucideIcon } from "lucide-react"
import { Activity, Briefcase, Heart, Users } from "lucide-react"

interface CategoryProgressCardProps {
  name: string
  color: string
  icon: string
  minutesSpent: number
  targetMinutes: number
  percentComplete: number
}

export function CategoryProgressCard({
  name,
  color,
  icon,
  minutesSpent,
  targetMinutes,
  percentComplete,
}: CategoryProgressCardProps) {
  // Map icon string to Lucide icon component
  const getIcon = (): LucideIcon => {
    switch (icon) {
      case "heart":
        return Heart
      case "users":
        return Users
      case "briefcase":
        return Briefcase
      case "activity":
        return Activity
      default:
        return Activity
    }
  }

  const IconComponent = getIcon()

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{name}</CardTitle>
          <IconComponent className="h-4 w-4" style={{ color }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color }}>
          {percentComplete}%
        </div>
        <Progress
          value={percentComplete}
          className="mt-2"
          indicatorClassName={`bg-[${color}]`}
          style={{ "--progress-background": color } as React.CSSProperties}
        />
      </CardContent>
      <CardFooter className="pt-1">
        <div className="text-xs text-muted-foreground">
          {formatMinutes(minutesSpent)} of {formatMinutes(targetMinutes)}
        </div>
      </CardFooter>
    </Card>
  )
}
