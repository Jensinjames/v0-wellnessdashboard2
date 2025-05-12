"use client"
import { EnhancedCategoryPerformance } from "@/components/enhanced-category-performance"
import { WellnessProvider } from "@/context/wellness-context"
import { IconProvider } from "@/context/icon-context"

export default function Home() {
  return (
    <WellnessProvider>
      <IconProvider>
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Wellness Dashboard</h1>

          <div className="space-y-8">
            {/* Category Performance Section */}
            <section>
              <EnhancedCategoryPerformance />
            </section>

            {/* Other dashboard sections can be added here */}
          </div>
        </main>
      </IconProvider>
    </WellnessProvider>
  )
}
