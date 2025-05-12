"use client"

import * as React from "react"
import { CardGrid, type CardGridItem } from "@/components/ui/card-grid"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

// Example category type - adjust based on your actual data structure
interface Category {
  id: string
  name: string
  description?: string
  color?: string
  subcategories?: Array<{
    id: string
    name: string
    value?: number
    progress?: number
  }>
}

export function CategoryGrid() {
  // Example query to fetch categories - replace with your actual data fetching logic
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      // Simulate API call - replace with your actual API call
      return [
        {
          id: "cat-1",
          name: "Faith",
          description: "Spiritual wellness and practices",
          color: "indigo",
          subcategories: [
            { id: "sub-1", name: "Meditation", progress: 75 },
            { id: "sub-2", name: "Prayer", progress: 60 },
            { id: "sub-3", name: "Study", progress: 40 },
          ],
        },
        {
          id: "cat-2",
          name: "Life",
          description: "Personal development and relationships",
          color: "emerald",
          subcategories: [
            { id: "sub-4", name: "Family", progress: 80 },
            { id: "sub-5", name: "Friends", progress: 65 },
            { id: "sub-6", name: "Hobbies", progress: 50 },
          ],
        },
        {
          id: "cat-3",
          name: "Work",
          description: "Professional growth and career",
          color: "amber",
          subcategories: [
            { id: "sub-7", name: "Skills", progress: 70 },
            { id: "sub-8", name: "Projects", progress: 45 },
            { id: "sub-9", name: "Networking", progress: 30 },
          ],
        },
        {
          id: "cat-4",
          name: "Health",
          description: "Physical and mental wellbeing",
          color: "rose",
          subcategories: [
            { id: "sub-10", name: "Exercise", progress: 55 },
            { id: "sub-11", name: "Nutrition", progress: 65 },
            { id: "sub-12", name: "Sleep", progress: 40 },
          ],
        },
      ]
    },
  })

  // Handle layout changes
  const handleLayoutChange = React.useCallback((layout: { id: string; width: number; height: number }[]) => {
    console.log("Layout changed:", layout)
    // You could save this to your backend or state management
  }, [])

  if (isLoading) {
    return <LoadingGrid />
  }

  // Transform categories into grid items
  const gridItems: CardGridItem[] = (categories || []).map((category) => ({
    id: category.id,
    minWidth: 250,
    minHeight: 200,
    content: (
      <>
        <CardHeader className={`bg-${category.color || "slate"}-50 dark:bg-${category.color || "slate"}-900/20`}>
          <CardTitle>{category.name}</CardTitle>
          {category.description && <CardDescription>{category.description}</CardDescription>}
        </CardHeader>
        <CardContent categoryData={category} showGraph>
          <div className="text-sm text-muted-foreground mb-2">{category.subcategories?.length || 0} subcategories</div>
        </CardContent>
      </>
    ),
  }))

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Category Performance</h2>
      <CardGrid
        items={gridItems}
        saveLayout
        layoutId="category-performance"
        onLayoutChange={handleLayoutChange}
        minColWidth={280}
        gap={16}
      />
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Category Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <div className="p-6">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="p-6 pt-0">
                <Skeleton className="h-[150px] w-full" />
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
