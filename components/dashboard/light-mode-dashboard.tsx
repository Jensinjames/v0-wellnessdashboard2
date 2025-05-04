"use client"

import { LightModeCard } from "@/components/ui/light-mode-card"
import { Button } from "@/components/ui/button"
import { HighContrastButton } from "@/components/ui/high-contrast-button"
import { PlusCircle, BarChart2, PieChart, Activity } from "lucide-react"
import { categoryColors } from "@/lib/theme-config"
import { useState } from "react"
import { cn } from "@/lib/utils"

// Sample data based on the screenshots
const sampleData = {
  faith: { percentage: 42, hours: 0.63, goal: 1.5 },
  life: { percentage: 30, hours: 1.2, goal: 4 },
  work: { percentage: 29, hours: 2, goal: 7 },
  health: { percentage: 42, hours: 8.05, goal: 19 },
  totalHours: 11.875,
  goalCompletion: 100,
}

export function LightModeDashboard() {
  const [viewType, setViewType] = useState<"pie" | "radial">("radial")

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Wellness Dashboard</h1>
        <p className="text-slate-600">Track and visualize your wellness journey</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <LightModeCard className="md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Wellness Distribution</h2>
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <Button
                variant={viewType === "pie" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType("pie")}
                aria-pressed={viewType === "pie"}
              >
                <PieChart className="h-4 w-4 mr-1" />
                Pie Chart
              </Button>
              <Button
                variant={viewType === "radial" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType("radial")}
                aria-pressed={viewType === "radial"}
              >
                <BarChart2 className="h-4 w-4 mr-1" />
                Radial View
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-64 h-64 mb-4">
              {/* Placeholder for chart - in a real app, you'd use a chart library */}
              <div className="absolute inset-0 rounded-full border-8 border-slate-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{sampleData.goalCompletion}%</div>
                  <div className="text-sm text-slate-600">Goal Completion</div>
                  <div className="text-xs text-slate-500 mt-1">{sampleData.totalHours} hours logged today</div>
                </div>
              </div>
              {/* Colored segments would be rendered by a chart library */}
              <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-[16px] border-blue-500 opacity-25 rotate-45"></div>
                <div className="absolute w-48 h-48 rounded-full border-[16px] border-yellow-500 opacity-25 rotate-[135deg]"></div>
                <div className="absolute w-48 h-48 rounded-full border-[16px] border-red-500 opacity-25 rotate-[225deg]"></div>
                <div className="absolute w-48 h-48 rounded-full border-[16px] border-green-500 opacity-25 rotate-[315deg]"></div>
              </div>
            </div>
          </div>
        </LightModeCard>

        <LightModeCard>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Daily Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Hours</span>
              <span className="font-semibold text-slate-900">{sampleData.totalHours} hrs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Goal Completion</span>
              <span className="font-semibold text-slate-900">{sampleData.goalCompletion}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Categories Tracked</span>
              <span className="font-semibold text-slate-900">4</span>
            </div>
            <div className="pt-4">
              <HighContrastButton className="w-full">
                <PlusCircle className="h-4 w-4" />
                Add New Entry
              </HighContrastButton>
            </div>
          </div>
        </LightModeCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Object.entries(sampleData).map(([category, data]) => {
          if (category === "totalHours" || category === "goalCompletion") return null

          const color = categoryColors[category as keyof typeof categoryColors]?.light || categoryColors.faith.light

          return (
            <LightModeCard key={category} className="relative overflow-hidden">
              <div className={cn("absolute top-0 left-0 h-1 w-full", color.bg)} />
              <h3 className="text-lg font-semibold text-slate-900 capitalize mb-2">{category}</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600">Progress</span>
                <span className={cn("font-semibold", color.text)}>{data.percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                <div
                  className={cn("h-2 rounded-full", color.bg)}
                  style={{ width: `${data.percentage}%` }}
                  role="progressbar"
                  aria-valuenow={data.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{data.hours} hrs</span>
                <span className="text-slate-500">Goal: {data.goal} hrs</span>
              </div>
            </LightModeCard>
          )
        })}
      </div>

      <LightModeCard>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Tracking History</h2>
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-1" />
            View All
          </Button>
        </div>
        <div className="space-y-4">
          {/* Sample history items */}
          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Morning Prayer</div>
              <div className="text-sm text-slate-500">Faith • 30 minutes</div>
            </div>
            <div className="text-sm text-slate-500">Today, 7:30 AM</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Gym Workout</div>
              <div className="text-sm text-slate-500">Health • 1 hour</div>
            </div>
            <div className="text-sm text-slate-500">Today, 6:00 AM</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Project Meeting</div>
              <div className="text-sm text-slate-500">Work • 45 minutes</div>
            </div>
            <div className="text-sm text-slate-500">Yesterday, 2:00 PM</div>
          </div>
        </div>
      </LightModeCard>
    </div>
  )
}
