"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CategoryIcon } from "@/components/ui/category-icon"
import { RealtimeStatus } from "@/components/ui/realtime-status"
import { useRealtimeCategories } from "@/hooks/use-realtime-categories"
import { getCurrentUser } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/database"

type Category = Database["public"]["Tables"]["categories"]["Row"]

interface CategoryGridRealtimeProps {
  onSelectCategory?: (category: Category) => void
  className?: string
}

export function CategoryGridRealtime({ onSelectCategory, className }: CategoryGridRealtimeProps) {
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    async function fetchUser() {
      const user = await getCurrentUser()
      setUserId(user?.id || null)
    }

    fetchUser()
  }, [])

  // Get categories with real-time updates
  const [categories, isLoading, error] = useRealtimeCategories(userId || "")

  // Handle category selection
  const handleCategoryClick = (category: Category) => {
    if (onSelectCategory) {
      onSelectCategory(category)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categories</h2>
        {userId && <RealtimeStatus isConnected={!error} />}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-24 flex items-center justify-center">
                <div className="w-full h-full bg-gray-200 rounded-md"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                `border-${category.color}-200 hover:border-${category.color}-300`,
              )}
              onClick={() => handleCategoryClick(category)}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                <CategoryIcon
                  categoryId={category.id}
                  icon={category.icon as any}
                  label={category.name}
                  className="h-8 w-8"
                />
                <span className="font-medium text-center">{category.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No categories found</p>
        </div>
      )}
    </div>
  )
}
