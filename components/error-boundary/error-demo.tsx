"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DataErrorBoundary,
  FormErrorBoundary,
  RenderErrorBoundary,
  CompactErrorBoundary,
} from "./specialized-boundaries"
import { useErrorBoundary } from "./use-error-boundary"
import { reportError, safeAsync } from "@/lib/error-reporting"

// Component that will throw an error when rendered
function BuggyCounter() {
  const [counter, setCounter] = useState(0)

  // This will cause an error when counter reaches 5
  if (counter === 5) {
    throw new Error("Counter reached 5!")
  }

  return (
    <div className="p-4 border rounded-md">
      <p className="mb-2">Counter: {counter}</p>
      <Button size="sm" onClick={() => setCounter(counter + 1)}>
        Increment
      </Button>
      <p className="text-xs text-muted-foreground mt-2">This component will crash when counter reaches 5</p>
    </div>
  )
}

// Component that will throw an error during data fetching
function BuggyDataFetcher() {
  const [data, setData] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      // Simulate a data fetching error
      await new Promise((resolve) => setTimeout(resolve, 1000))
      throw new Error("Failed to fetch data from API")
    } catch (error) {
      if (error instanceof Error) {
        throw error // This error will be caught by the error boundary
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-md">
      {data ? (
        <p>Data: {data}</p>
      ) : (
        <Button size="sm" onClick={fetchData} disabled={loading}>
          {loading ? "Loading..." : "Fetch Data"}
        </Button>
      )}
      <p className="text-xs text-muted-foreground mt-2">This component will throw during data fetching</p>
    </div>
  )
}

// Component that demonstrates the useErrorBoundary hook
function HookErrorDemo() {
  const [state, { showBoundary }] = useErrorBoundary()

  if (state.hasError) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
        <h3 className="text-red-800 font-medium">Error from hook</h3>
        <p className="text-red-600 text-sm mt-1">{state.error?.message}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 border rounded-md">
      <Button size="sm" onClick={() => showBoundary(new Error("Error triggered from hook"))}>
        Trigger Error
      </Button>
      <p className="text-xs text-muted-foreground mt-2">This uses the useErrorBoundary hook to handle errors</p>
    </div>
  )
}

// Component that demonstrates safe async function usage
function SafeAsyncDemo() {
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSafeAsync = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    // Use the safeAsync utility to safely handle async errors
    const [data, err] = await safeAsync(
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("API request failed")), 1000)
      }),
      "network_error",
    )

    setLoading(false)
    if (data) {
      setResult(data)
    } else if (err) {
      setError(err.message)
      // The error has already been reported by safeAsync
    }
  }

  return (
    <div className="p-4 border rounded-md">
      {loading ? (
        <p>Loading...</p>
      ) : result ? (
        <p>Result: {result}</p>
      ) : error ? (
        <div className="text-red-600 text-sm mb-2">{error}</div>
      ) : null}

      <Button size="sm" onClick={handleSafeAsync} disabled={loading}>
        Try Safe Async
      </Button>
      <p className="text-xs text-muted-foreground mt-2">This demonstrates safe async error handling without crashing</p>
    </div>
  )
}

// Main demo component
export function ErrorBoundaryDemo() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Error Boundary Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="render">
          <TabsList className="mb-4">
            <TabsTrigger value="render">Render Errors</TabsTrigger>
            <TabsTrigger value="data">Data Errors</TabsTrigger>
            <TabsTrigger value="form">Form Errors</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="render">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">With Error Boundary</h3>
                <RenderErrorBoundary>
                  <BuggyCounter />
                </RenderErrorBoundary>
              </div>

              <div>
                <h3 className="font-medium mb-2">Without Error Boundary</h3>
                <p className="text-sm text-muted-foreground mb-2">This would crash the entire application</p>
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
                  <p className="text-yellow-800">Component not rendered for safety</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">With Data Error Boundary</h3>
                <DataErrorBoundary>
                  <BuggyDataFetcher />
                </DataErrorBoundary>
              </div>

              <div>
                <h3 className="font-medium mb-2">With Safe Async Handling</h3>
                <SafeAsyncDemo />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="form">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Form Error Boundary</h3>
                <FormErrorBoundary>
                  <div className="p-4 border rounded-md">
                    <Button
                      size="sm"
                      onClick={() => {
                        throw new Error("Form submission failed")
                      }}
                    >
                      Submit Form (Will Error)
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">This simulates a form submission error</p>
                  </div>
                </FormErrorBoundary>
              </div>

              <div>
                <h3 className="font-medium mb-2">Compact Error Boundary</h3>
                <CompactErrorBoundary>
                  <div className="p-4 border rounded-md">
                    <Button
                      size="sm"
                      onClick={() => {
                        throw new Error("Widget failed to load")
                      }}
                    >
                      Load Widget (Will Error)
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      This uses a compact error UI for smaller components
                    </p>
                  </div>
                </CompactErrorBoundary>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Error Boundary Hook</h3>
                <HookErrorDemo />
              </div>

              <div>
                <h3 className="font-medium mb-2">Manual Error Reporting</h3>
                <div className="p-4 border rounded-md">
                  <Button
                    size="sm"
                    onClick={() => {
                      try {
                        // Simulate some error
                        throw new Error("Something went wrong in a click handler")
                      } catch (error) {
                        if (error instanceof Error) {
                          // Manually report the error
                          reportError("ui_component_error", error)
                          alert("Error reported! Check console.")
                        }
                      }
                    }}
                  >
                    Trigger & Report Error
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">This manually reports an error without crashing</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
