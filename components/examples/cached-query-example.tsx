"use client"

import type React from "react"

import { useState } from "react"
import { useCachedSupabaseQuery } from "@/hooks/use-cached-supabase-query"
import { useCachedSupabaseMutation } from "@/hooks/use-cached-supabase-mutation"
import { getEnhancedQueryCache } from "@/lib/enhanced-query-cache"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CachedQueryExample() {
  const [category, setCategory] = useState("")

  // Get cache instance for stats
  const cache = getEnhancedQueryCache()
  const [stats, setStats] = useState(cache.getStats())

  // Fetch categories with caching
  const {
    data: categories,
    isLoading,
    isError,
    error,
    refetch,
    isStale,
  } = useCachedSupabaseQuery(
    "categories",
    {
      columns: "*",
      order: { column: "name", ascending: true },
    },
    {
      cacheTime: 5 * 60 * 1000, // 5 minutes
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: true,
    },
  )

  // Add category mutation
  const { mutate: addCategory, isLoading: isAdding } = useCachedSupabaseMutation("categories", "insert", {
    invalidateTags: ["categories"],
    onSuccess: () => {
      setCategory("")
    },
  })

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!category.trim()) return

    addCategory({
      name: category,
      user_id: "current-user-id", // In a real app, get this from auth context
      created_at: new Date().toISOString(),
    })
  }

  // Update stats periodically
  const updateStats = () => {
    setStats(cache.getStats())
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Cached Categories</span>
            {isStale && <Badge variant="outline">Stale</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : isError ? (
            <div className="text-red-500">Error: {error?.message}</div>
          ) : categories?.length === 0 ? (
            <div className="text-muted-foreground">No categories found</div>
          ) : (
            <ul className="space-y-2">
              {categories?.map((category: any) => (
                <li key={category.id} className="flex items-center justify-between border-b pb-2">
                  <span>{category.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(category.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
          <Button variant="outline" onClick={updateStats}>
            Update Stats
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category Name</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category name"
                disabled={isAdding}
              />
            </div>
            <Button type="submit" disabled={isAdding || !category.trim()}>
              {isAdding ? "Adding..." : "Add Category"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Size</h3>
              <p>{stats.size} entries</p>
            </div>
            <div>
              <h3 className="font-medium">Hit Rate</h3>
              <p>{(stats.hitRate * 100).toFixed(1)}%</p>
            </div>
            <div>
              <h3 className="font-medium">Hits</h3>
              <p>
                {stats.hits} ({stats.staleHits} stale)
              </p>
            </div>
            <div>
              <h3 className="font-medium">Misses</h3>
              <p>{stats.misses}</p>
            </div>
            <div>
              <h3 className="font-medium">Evictions</h3>
              <p>{stats.evictions}</p>
            </div>
            <div>
              <h3 className="font-medium">Expired</h3>
              <p>{stats.expired}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => {
              cache.clear()
              updateStats()
            }}
          >
            Clear Cache
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
