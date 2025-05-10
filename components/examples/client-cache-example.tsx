"use client"

import { useState, useEffect } from "react"
import { isomorphicCache, CACHE_EXPIRY } from "@/lib/isomorphic-cache"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export function ClientCacheExample() {
  const [cacheStats, setCacheStats] = useState({ size: 0, entries: [] })
  const [refreshKey, setRefreshKey] = useState(0)

  // Add a test item to the cache
  const addTestItem = () => {
    const key = `test-item-${Date.now()}`
    isomorphicCache.set(
      key,
      {
        timestamp: new Date().toISOString(),
        value: Math.random(),
      },
      CACHE_EXPIRY.SHORT,
    )

    setRefreshKey((prev) => prev + 1)
  }

  // Clear all cache items
  const clearCache = () => {
    isomorphicCache.clear()
    setRefreshKey((prev) => prev + 1)
  }

  // Get cache stats
  useEffect(() => {
    setCacheStats(isomorphicCache.getStats())

    // Set up an interval to refresh stats
    const interval = setInterval(() => {
      setCacheStats(isomorphicCache.getStats())
    }, 5000)

    return () => clearInterval(interval)
  }, [refreshKey])

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Client Cache Example</CardTitle>
        <CardDescription>This example demonstrates the isomorphic cache working on the client side</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Cache Stats</h3>
            <p className="text-sm text-muted-foreground">Total items in cache: {cacheStats.size}</p>
          </div>

          {cacheStats.entries.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-2">Cache Entries</h4>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                <ul className="space-y-1">
                  {cacheStats.entries.map((entry) => (
                    <li key={entry.key} className="text-xs">
                      <span className="font-mono">{entry.key}</span>
                      <span className="text-muted-foreground ml-2">(expires in {entry.expiresIn}s)</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={addTestItem}>
          Add Test Item
        </Button>
        <Button variant="destructive" onClick={clearCache}>
          Clear Cache
        </Button>
      </CardFooter>
    </Card>
  )
}
