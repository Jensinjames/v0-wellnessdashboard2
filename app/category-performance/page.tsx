"use client"

import { EnhancedCategoryPerformance } from "@/components/enhanced-category-performance"
import { WellnessProvider } from "@/context/wellness-context"
import { IconProvider } from "@/context/icon-context"

export default function CategoryPerformancePage() {
  return (
    <WellnessProvider>
      <IconProvider>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Category Performance Dashboard</h1>
          <p className="text-muted-foreground mb-8">
            Visualize and manage your wellness categories. Resize cards to customize your view.
          </p>

          <EnhancedCategoryPerformance />
        </div>
      </IconProvider>
    </WellnessProvider>
  )
}
