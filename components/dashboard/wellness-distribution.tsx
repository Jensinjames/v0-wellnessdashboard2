"use client"

import { useWellnessMetrics } from "@/context/wellness-metrics-context"
import { PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts"

type WellnessDistributionProps = {
  view: "radial" | "pie"
}

const COLORS = {
  faith: "#8884d8",
  life: "#82ca9d",
  work: "#ffc658",
  health: "#ff8042",
}

const CATEGORY_LABELS = {
  faith: "Faith",
  life: "Life",
  work: "Work",
  health: "Health",
}

export function WellnessDistribution({ view }: WellnessDistributionProps) {
  const { metrics } = useWellnessMetrics()

  const pieData = [
    { name: "Faith", value: metrics.totalHours.faith, color: COLORS.faith },
    { name: "Life", value: metrics.totalHours.life, color: COLORS.life },
    { name: "Work", value: metrics.totalHours.work, color: COLORS.work },
    { name: "Health", value: metrics.totalHours.health, color: COLORS.health },
  ].filter((item) => item.value > 0)

  const radialData = [
    {
      name: "Faith",
      value: metrics.percentages.faith,
      fill: COLORS.faith,
      hours: metrics.totalHours.faith.toFixed(1),
      goal: metrics.goalHours.faith,
    },
    {
      name: "Life",
      value: metrics.percentages.life,
      fill: COLORS.life,
      hours: metrics.totalHours.life.toFixed(1),
      goal: metrics.goalHours.life,
    },
    {
      name: "Work",
      value: metrics.percentages.work,
      fill: COLORS.work,
      hours: metrics.totalHours.work.toFixed(1),
      goal: metrics.goalHours.work,
    },
    {
      name: "Health",
      value: metrics.percentages.health,
      fill: COLORS.health,
      hours: metrics.totalHours.health.toFixed(1),
      goal: metrics.goalHours.health,
    },
  ]

  if (view === "pie" && pieData.length === 0) {
    return <div className="flex justify-center items-center h-64">No data to display</div>
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="text-2xl font-bold">{metrics.overallCompletion.toFixed(0)}% Goal Completion</div>
        <div className="text-sm text-muted-foreground">
          {Object.values(metrics.totalHours)
            .reduce((sum, val) => sum + val, 0)
            .toFixed(2)}{" "}
          hours logged
        </div>
      </div>

      <div className="h-64">
        {view === "pie" ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="80%"
              barSize={20}
              data={radialData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                background
                dataKey="value"
                label={{
                  position: "insideStart",
                  fill: "#fff",
                  formatter: (value: number) => `${value.toFixed(0)}%`,
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <div key={key} className="flex flex-col">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[key as keyof typeof COLORS] }}
              />
              <span className="font-medium">{label}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {metrics.percentages[key as keyof typeof COLORS].toFixed(0)}% (
              {metrics.totalHours[key as keyof typeof COLORS].toFixed(1)} hrs, goal:{" "}
              {metrics.goalHours[key as keyof typeof COLORS]} hrs)
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
