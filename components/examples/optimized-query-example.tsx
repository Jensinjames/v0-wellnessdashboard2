"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useOptimizedSupabase } from "@/hooks/use-optimized-supabase"
import { Loader2 } from "lucide-react"

export function OptimizedQueryExample() {
  const { useQuery, connectionHealth } = useOptimizedSupabase()

  // Example query using our optimized hook
  const {
    data: categories,
    isLoading,
    isError,
    isNetworkError,
    isRateLimited,
    refetch,
  } = useQuery((supabase) => supabase.from("wellness_categories").select("*").limit(5), {
    retry: true,
    maxRetries: 3,
    timeout: 8000,
    refetchInterval: 60000, // Refetch every minute
    onNetworkError: () => {
      console.log("Network error detected in categories query")
    },
    onRateLimit: () => {
      console.log("Rate limit detected in categories query")
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimized Query Example</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {isNetworkError && (
          <Alert variant="destructive">
            <AlertDescription>
              Network error: Unable to fetch categories. Please check your connection.
            </AlertDescription>
          </Alert>
        )}

        {isRateLimited && (
          <Alert variant="warning">
            <AlertDescription>Rate limit detected. The request has been throttled.</AlertDescription>
          </Alert>
        )}

        {isError && !isNetworkError && !isRateLimited && (
          <Alert variant="destructive">
            <AlertDescription>Error fetching categories. Please try again.</AlertDescription>
          </Alert>
        )}

        {categories && (
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
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
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
