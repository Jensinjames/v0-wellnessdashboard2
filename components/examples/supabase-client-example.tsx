"use client"

import { useState, useEffect } from "react"
import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function SupabaseClientExample() {
  const { supabase, isConnected, query } = useSupabaseClient()
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    setIsLoading(true)
    setError(null)

    const { data, error } = await query((client) => client.from("wellness_categories").select("*").limit(5))

    if (error) {
      setError(error.message)
    } else {
      setCategories(data || [])
    }

    setIsLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Client Example</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <Alert variant="destructive">
            <AlertDescription>Database connection is currently unavailable. Please try again later.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Categories ({categories.length})</h3>
            <ul className="space-y-1">
              {categories.map((category) => (
                <li key={category.id} className="text-sm">
                  <span
                    className="inline-block h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  ></span>
                  {category.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={fetchCategories} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </>
            ) : (
              "Refresh Data"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
