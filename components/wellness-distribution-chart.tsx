"use client"

import { useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CategorySummary } from "@/utils/wellness-utils"
import { formatMinutes } from "@/utils/wellness-utils"

interface WellnessDistributionChartProps {
  data: CategorySummary[]
  totalMinutesSpent: number
  totalTargetMinutes: number
  percentComplete: number
}

export function WellnessDistributionChart({
  data,
  totalMinutesSpent,
  totalTargetMinutes,
  percentComplete,
}: WellnessDistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    )
  }

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(undefined)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wellness Distribution</CardTitle>
        <CardDescription>{percentComplete}% Goal Completion for today</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative h-64 w-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="minutesSpent"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold">{formatMinutes(totalMinutesSpent)}</span>
            <span className="text-sm text-muted-foreground">
              {totalTargetMinutes > 0 ? `of ${formatMinutes(totalTargetMinutes)}` : "logged"}
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {data.map((category) => (
            <div key={category.id} className="flex flex-col items-center">
              <span className="mb-1 h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="text-sm font-medium">{category.name}</span>
              <span className="text-xs text-muted-foreground">{category.percentComplete}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
