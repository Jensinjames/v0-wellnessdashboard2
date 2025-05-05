"use client"

import { useState } from "react"
import { useWellness } from "@/context/wellness-context"
import { MobileCategoryCards } from "./mobile-category-cards"
import { MobileMetricCards } from "./mobile-metric-cards"
import { MobileEntriesList } from "./mobile-entries-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MobileWellnessChart } from "./mobile-wellness-chart"
import type { WellnessEntryData } from "@/types/wellness"

interface MobileDashboardProps {
  onEditEntry: (entry: WellnessEntryData) => void
}

export function MobileDashboard({ onEditEntry }: MobileDashboardProps) {
  const { categories } = useWellness()
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="entries">Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <MobileMetricCards />
          <MobileWellnessChart />
          <MobileCategoryCards categories={categories.filter((c) => c.enabled).slice(0, 4)} showViewAll={true} />
        </TabsContent>

        <TabsContent value="categories" className="mt-4 space-y-6">
          <MobileCategoryCards categories={categories.filter((c) => c.enabled)} showViewAll={false} />
        </TabsContent>

        <TabsContent value="entries" className="mt-4 space-y-6">
          <MobileEntriesList onEditEntry={onEditEntry} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
