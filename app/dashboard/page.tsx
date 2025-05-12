"use client"

import { useState } from "react"
import { CategoryGridRealtime } from "@/components/category-grid-realtime"
import { EntriesListRealtime } from "@/components/entries-list-realtime"
import { GoalProgressRealtime } from "@/components/goal-progress-realtime"
import type { Database } from "@/types/database"
import type { WellnessEntryData } from "@/types/wellness"

type Category = Database["public"]["Tables"]["categories"]["Row"]

export default function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category)
  }

  // Handle entry edit (placeholder)
  const handleEditEntry = (entry: WellnessEntryData) => {
    console.log("Edit entry:", entry)
    // Implement your edit logic here
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Wellness Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CategoryGridRealtime onSelectCategory={handleCategorySelect} />

          <div className="mt-6">
            <EntriesListRealtime onEdit={handleEditEntry} />
          </div>
        </div>

        <div>
          <GoalProgressRealtime categoryId={selectedCategory?.id} />
        </div>
      </div>
    </div>
  )
}
