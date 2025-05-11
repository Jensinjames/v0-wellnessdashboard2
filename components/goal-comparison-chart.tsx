"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import type { WellnessEntryData, WellnessCategory, CategoryId } from "@/types/wellness"

interface GoalComparisonChartProps {
  entry: WellnessEntryData
  categories: WellnessCategory[]
  getCategoryScore: (entry: WellnessEntryData, categoryId: CategoryId) => number
}

interface GoalData {
  name: string
  current: number
  goal: number
  fill: string
  gap: number
}

export function GoalComparisonChart({ entry, categories, getCategoryScore }: GoalComparisonChartProps) {
  const enabledCategories = categories.filter((c) => c.enabled)

  // Get goal comparison data for charts
  const goalData: GoalData[] = enabledCategories.map((category) => {
    const categoryScore = getCategoryScore(entry, category.id)
    const goalScore = 80 // Default goal score, could be customized per category

    return {
      name: category.name,
      current: categoryScore,
      goal: goalScore,
      fill: `var(--${category.color})`,
      gap: Math.max(0, goalScore - categoryScore),
    }
  })

  const entryDate = format(new Date(entry.date), "MMM d, yyyy")

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{entryDate} - Goal Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={goalData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
              <YAxis
                label={{
                  value: "Score (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <Bar dataKey="current" name="Current Score">
                {goalData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`#${entry.name.toLowerCase() === "faith" ? "22c55e" : entry.name.toLowerCase() === "life" ? "eab308" : entry.name.toLowerCase() === "work" ? "ef4444" : entry.name.toLowerCase() === "health" ? "ec4899" : entry.name.toLowerCase() === "mindfulness" ? "22c55e" : entry.name.toLowerCase() === "learning" ? "3b82f6" : entry.name.toLowerCase() === "relationships" ? "8b5cf6" : "64748b"}`}
                  />
                ))}
                <LabelList dataKey="current" position="top" />
              </Bar>
              <ReferenceLine y={80} stroke="#8884d8" strokeDasharray="3 3" label="Goal" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {goalData.map((item) => (
            <div key={item.name} className="border rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">{item.name}</h4>
                <Badge variant={item.current >= item.goal ? "success" : "outline"}>
                  {Math.round((item.current / item.goal) * 100)}%
                </Badge>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Current: {item.current}%</span>
                <span>Goal: {item.goal}%</span>
              </div>
              <Progress
                value={(item.current / item.goal) * 100}
                className="h-2"
                indicatorClassName={`bg-${item.name.toLowerCase() === "faith" ? "green" : item.name.toLowerCase() === "life" ? "yellow" : item.name.toLowerCase() === "work" ? "red" : item.name.toLowerCase() === "health" ? "pink" : item.name.toLowerCase() === "mindfulness" ? "green" : item.name.toLowerCase() === "learning" ? "blue" : item.name.toLowerCase() === "relationships" ? "purple" : "slate"}-500`}
              />
              <div className="text-xs text-center">
                {item.current < item.goal ? (
                  <span>Need {item.gap}% more to reach goal</span>
                ) : (
                  <span className="text-green-500">Goal achieved!</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
