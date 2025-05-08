import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// This is a server component that displays static data
function ServerData() {
  const timestamp = new Date().toISOString()
  const randomValue = Math.random()

  return (
    <div className="space-y-2">
      <p>
        <strong>Timestamp:</strong> {timestamp}
      </p>
      <p>
        <strong>Random Value:</strong> {randomValue.toFixed(6)}
      </p>
      <p>
        <strong>Message:</strong> This data was generated on the server
      </p>
    </div>
  )
}

// This is the main component that can be imported in pages
export function SSRCacheExample() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>SSR Example</CardTitle>
        <CardDescription>This example demonstrates server-side rendering</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div>Loading data...</div>}>
          <ServerData />
        </Suspense>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            The data above was generated on the server. In a real application, this would use the isomorphic cache
            system.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
