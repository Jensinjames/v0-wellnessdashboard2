import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Briefcase, Leaf, Sun } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function CategoryOverview() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <CategoryCard
        title="Faith"
        icon={<Leaf className="h-5 w-5 text-white" />}
        color="bg-green-500"
        progress={0}
        goal={100}
        actual={0}
      />
      <CategoryCard
        title="Life"
        icon={<Sun className="h-5 w-5 text-white" />}
        color="bg-yellow-500"
        progress={0}
        goal={100}
        actual={0}
      />
      <CategoryCard
        title="Work"
        icon={<Briefcase className="h-5 w-5 text-white" />}
        color="bg-red-500"
        progress={0}
        goal={100}
        actual={0}
      />
      <CategoryCard
        title="Health"
        icon={<Heart className="h-5 w-5 text-white" />}
        color="bg-pink-500"
        progress={0}
        goal={100}
        actual={0}
      />
    </div>
  )
}

interface CategoryCardProps {
  title: string
  icon: React.ReactNode
  color: string
  progress: number
  goal: number
  actual: number
}

function CategoryCard({ title, icon, color, progress, goal, actual }: CategoryCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`${color} rounded-md p-1.5`}>{icon}</div>
          <h3 className="font-medium">{title}</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Goal</span>
            <span className="font-medium">{goal}%</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Actual</span>
            <span className="font-medium">{actual}%</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
