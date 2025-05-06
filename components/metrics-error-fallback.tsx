"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw } from "lucide-react"

interface MetricsErrorFallbackProps {
  categoryId: string
  categoryName: string
  onRetry: () => void
  error?: string
}

export function MetricsErrorFallback({ categoryId, categoryName, onRetry, error }: MetricsErrorFallbackProps) {
  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-base font-medium text-red-700 dark:text-red-400">
          <AlertCircle className="mr-2 h-5 w-5" />
          Unable to load metrics for {categoryName}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2 text-sm text-red-600 dark:text-red-300">
        <p>
          We couldn't load the metrics for this category. This might be due to a network issue or the data might be
          temporarily unavailable.
        </p>
        {error && <p className="mt-2 text-xs text-red-500 dark:text-red-400">Error details: {error}</p>}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-red-200 bg-white text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Loading
        </Button>
      </CardFooter>
    </Card>
  )
}
