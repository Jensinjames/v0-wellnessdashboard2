"use client"

import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import * as Icons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { WellnessCategory } from "@/types/wellness"
import { getCategoryColorClass } from "@/types/wellness"
import Link from "next/link"

interface MobileCategoryCardsProps {
  categories: WellnessCategory[]
  showViewAll: boolean
}

export function MobileCategoryCards({ categories, showViewAll }: MobileCategoryCardsProps) {
  // Get icon component by name
  const getIconByName = (name: string): LucideIcon => {
    return (Icons[name as keyof typeof Icons] as LucideIcon) || Icons.Activity
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Categories</h2>
        {showViewAll && (
          <Link href="/mobile/categories">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
              View All
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {categories.map((category) => {
          const Icon = getIconByName(category.icon)
          const colorClass = getCategoryColorClass(category, "text")
          const bgColorClass = getCategoryColorClass(category, "bg")

          // Calculate progress
          const progress = Math.round(Math.random() * 100) // Placeholder

          return (
            <Card key={category.id} className="border shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={cn("p-1.5 rounded-md", bgColorClass || "bg-gray-100")}>
                    <Icon className={cn("h-4 w-4", "text-white")} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{category.name}</h3>
                    <div className="mt-1.5">
                      <Progress
                        value={progress}
                        className="h-1.5 bg-gray-100"
                        indicatorClassName={bgColorClass}
                        aria-label={`${category.name} progress: ${progress}%`}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium">{progress}%</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
