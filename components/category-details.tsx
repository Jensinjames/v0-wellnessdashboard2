"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProgressCircle } from "@/components/progress-circle"
import { useWellness } from "@/context/wellness-context"

export function CategoryDetails() {
  const [activeTab, setActiveTab] = useState("faith")
  const { categories } = useWellness()

  // Get enabled categories
  const enabledCategories = categories.filter((cat) => cat.enabled)

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Category Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4">
            <TabsList className="w-full justify-start rounded-none border-b-0 p-0">
              {enabledCategories.slice(0, 4).map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="relative rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {enabledCategories.slice(0, 4).map((category) => (
            <TabsContent key={category.id} value={category.id} className="p-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col items-center justify-center">
                  <ProgressCircle
                    value={
                      category.id === "faith" ? 42 : category.id === "life" ? 30 : category.id === "work" ? 29 : 42
                    }
                    size={160}
                    strokeWidth={12}
                    className={`text-${category.color}-500`}
                  />
                </div>
                <div className="space-y-4">
                  {category.metrics.map((metric) => (
                    <div key={metric.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{metric.name}</span>
                        <span className="text-sm font-medium">
                          {metric.id === "dailyPrayer"
                            ? "0.0/30"
                            : metric.id === "meditation"
                              ? "0.0/20"
                              : metric.id === "scriptureStudy"
                                ? "0.0/30"
                                : metric.id === "exercise"
                                  ? "0.0/5"
                                  : metric.id === "sleep"
                                    ? "0.0/8"
                                    : metric.id === "stressLevel"
                                      ? "0/10"
                                      : "0%"}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full bg-${category.color}-500`}
                          style={{
                            width: `${metric.id === "dailyPrayer" ? 20 : metric.id === "meditation" ? 30 : 10}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
