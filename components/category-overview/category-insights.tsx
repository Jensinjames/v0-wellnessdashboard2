"use client"

import { useCategoryInsights } from "@/hooks/use-edge-functions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lightbulb } from "lucide-react"

interface CategoryInsightsProps {
  category: string
}

export function CategoryInsights({ category }: CategoryInsightsProps) {
  const { data, error, loading } = useCategoryInsights(category)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-3/4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error loading insights: {error}</AlertDescription>
      </Alert>
    )
  }

  if (!data || !data.insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Personalized insights for {category}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4 text-muted-foreground">No insights available yet for this category.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Insights for {category}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p>{data.insights}</p>
        </div>

        {data.recommendations && data.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Recommendations</h4>
            <ul className="space-y-1 list-disc pl-5">
              {data.recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
