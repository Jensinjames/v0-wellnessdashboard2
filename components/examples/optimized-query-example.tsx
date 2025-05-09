"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'

export default function OptimizedQueryExample() {
  const { read, write } = useSupabase()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queryTime, setQueryTime] = useState<number | null>(null)

  // Example of selective column query
  const fetchData = async (useCache = true) => {
    setLoading(true)
    setError(null)
    const startTime = performance.now()

    try {
      // Only select the columns we need
      const result = await read<any[]>("wellness_categories", (query) => query.limit(10), {
        columns: ["id", "name", "color"], // Only select needed columns
        cacheKey: "example-query",
        bypassCache: !useCache,
        debug: true,
      })

      setData(result || [])
      setQueryTime(performance.now() - startTime)
    } catch (err: any) {
      console.error("Query error:", err)
      setError(err.message || "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  // Example of a write operation
  const addTestData = async () => {
    setLoading(true)
    setError(null)

    try {
      await write(
        "wellness_categories",
        "insert",
        {
          name: `Test Category ${Date.now()}`,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        (query) => query,
        {
          requiresAuth: true,
        },
      )

      // Refresh data
      await fetchData(false)
    } catch (err: any) {
      console.error("Write error:", err)
      setError(err.message || "Failed to add test data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimized Query Example</CardTitle>
        <CardDescription>Demonstrating selective columns and caching</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button onClick={() => fetchData(true)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Fetch (Cached)
          </Button>
          <Button onClick={() => fetchData(false)} disabled={loading} variant="outline">
            Fetch (Bypass Cache)
          </Button>
          <Button onClick={addTestData} disabled={loading} variant="secondary">
            Add Test Data
          </Button>
        </div>

        {queryTime !== null && (
          <p className="text-sm text-muted-foreground mb-4">Query completed in {queryTime.toFixed(2)}ms</p>
        )}

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Results ({data.length})</h3>
          <pre className="text-xs overflow-auto max-h-[300px] p-2 bg-muted rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
