"use client"

import { useState } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, WifiOff, Lock, Clock, Ban, ServerCrash } from "lucide-react"

export function SupabaseErrorTester() {
  const { supabase, isInitialized, isOnline, query, refreshToken, getTokenStatus } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [recoveryAttempted, setRecoveryAttempted] = useState(false)
  const [recoverySuccess, setRecoverySuccess] = useState(false)

  // Reset state for new test
  const resetState = () => {
    setIsLoading(false)
    setResult(null)
    setError(null)
    setRecoveryAttempted(false)
    setRecoverySuccess(false)
  }

  // 1. Test network error handling
  const testNetworkError = async () => {
    resetState()
    setIsLoading(true)

    try {
      // Simulate a network error by providing an invalid URL
      const result = await query(
        (client) => {
          // Override the fetch method to simulate a network error
          const originalFetch = window.fetch
          window.fetch = () => Promise.reject(new TypeError("Failed to fetch"))

          // Make the query
          const promise = client.from("profiles").select("*").limit(1)

          // Restore the original fetch
          setTimeout(() => {
            window.fetch = originalFetch
          }, 100)

          return promise
        },
        {
          retries: 1, // Limit retries for faster testing
          offlineAction: async () => {
            setRecoveryAttempted(true)
            setRecoverySuccess(true)
            return { data: [{ id: "offline-1", name: "Offline Data" }], count: 1 }
          },
        },
      )

      setResult(result)
    } catch (err: any) {
      console.error("Network error test:", err)
      setError(err.message || "Network error occurred")

      // Try recovery
      try {
        setRecoveryAttempted(true)
        // Check if we're back online
        const isOnline = navigator.onLine
        if (isOnline) {
          await refreshToken()
          setRecoverySuccess(true)
        }
      } catch (recoveryErr) {
        setRecoverySuccess(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Test authentication error handling
  const testAuthError = async () => {
    resetState()
    setIsLoading(true)

    try {
      // Simulate an auth error by making a request that requires auth
      const result = await query(
        (client) => {
          // Create a fake 401 response
          const mockResponse = new Response(
            JSON.stringify({
              error: "Invalid JWT token",
              message: "JWT token is invalid or has expired",
            }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            },
          )

          // Mock the fetch to return our fake response
          const originalFetch = window.fetch
          window.fetch = () => Promise.resolve(mockResponse)

          // Make the query
          const promise = client.from("profiles").select("*").limit(1)

          // Restore the original fetch
          setTimeout(() => {
            window.fetch = originalFetch
          }, 100)

          return promise
        },
        {
          requiresAuth: true,
          retries: 1,
        },
      )

      setResult(result)
    } catch (err: any) {
      console.error("Auth error test:", err)
      setError(err.message || "Authentication error occurred")

      // Try recovery
      try {
        setRecoveryAttempted(true)
        const refreshed = await refreshToken()
        setRecoverySuccess(refreshed)
      } catch (recoveryErr) {
        setRecoverySuccess(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Test permission error handling
  const testPermissionError = async () => {
    resetState()
    setIsLoading(true)

    try {
      // Simulate a permission error
      const result = await query(
        (client) => {
          // Create a fake 403 response
          const mockResponse = new Response(
            JSON.stringify({
              error: "Permission denied",
              message: "User does not have access to the requested resource",
            }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            },
          )

          // Mock the fetch to return our fake response
          const originalFetch = window.fetch
          window.fetch = () => Promise.resolve(mockResponse)

          // Make the query
          const promise = client.from("restricted_table").select("*").limit(1)

          // Restore the original fetch
          setTimeout(() => {
            window.fetch = originalFetch
          }, 100)

          return promise
        },
        { retries: 1 },
      )

      setResult(result)
    } catch (err: any) {
      console.error("Permission error test:", err)
      setError(err.message || "Permission error occurred")

      // No recovery for permission errors
      setRecoveryAttempted(true)
      setRecoverySuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  // 4. Test rate limit error handling
  const testRateLimitError = async () => {
    resetState()
    setIsLoading(true)

    try {
      // Simulate a rate limit error
      const result = await query(
        (client) => {
          // Create a fake 429 response
          const mockResponse = new Response(
            JSON.stringify({
              error: "Too many requests",
              message: "Rate limit exceeded. Please try again later.",
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": "5",
              },
            },
          )

          // Mock the fetch to return our fake response
          const originalFetch = window.fetch
          window.fetch = () => Promise.resolve(mockResponse)

          // Make the query
          const promise = client.from("profiles").select("*").limit(1)

          // Restore the original fetch
          setTimeout(() => {
            window.fetch = originalFetch
          }, 100)

          return promise
        },
        {
          retries: 2,
          retryDelay: 500, // Short delay for testing
        },
      )

      setResult(result)
    } catch (err: any) {
      console.error("Rate limit error test:", err)
      setError(err.message || "Rate limit error occurred")

      // Try recovery after a delay
      try {
        setRecoveryAttempted(true)
        // In a real scenario, we would wait for the Retry-After period
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const result = await query((client) => client.from("profiles").select("count").limit(1))
        setRecoverySuccess(!!result)
      } catch (recoveryErr) {
        setRecoverySuccess(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 5. Test server error handling
  const testServerError = async () => {
    resetState()
    setIsLoading(true)

    try {
      // Simulate a server error
      const result = await query(
        (client) => {
          // Create a fake 500 response
          const mockResponse = new Response(
            JSON.stringify({
              error: "Internal server error",
              message: "An unexpected error occurred on the server",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          )

          // Mock the fetch to return our fake response
          const originalFetch = window.fetch
          window.fetch = () => Promise.resolve(mockResponse)

          // Make the query
          const promise = client.from("profiles").select("*").limit(1)

          // Restore the original fetch
          setTimeout(() => {
            window.fetch = originalFetch
          }, 100)

          return promise
        },
        {
          retries: 2,
          retryDelay: 500, // Short delay for testing
        },
      )

      setResult(result)
    } catch (err: any) {
      console.error("Server error test:", err)
      setError(err.message || "Server error occurred")

      // Try recovery
      try {
        setRecoveryAttempted(true)
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const result = await query((client) => client.from("profiles").select("count").limit(1))
        setRecoverySuccess(!!result)
      } catch (recoveryErr) {
        setRecoverySuccess(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 6. Test timeout error handling
  const testTimeoutError = async () => {
    resetState()
    setIsLoading(true)

    try {
      // Simulate a timeout error
      const result = await query(
        (client) => {
          return new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error("Request timed out after 3000ms"))
            }, 1000)
          })
        },
        {
          retries: 1,
          retryDelay: 500, // Short delay for testing
        },
      )

      setResult(result)
    } catch (err: any) {
      console.error("Timeout error test:", err)
      setError(err.message || "Timeout error occurred")

      // Try recovery
      try {
        setRecoveryAttempted(true)
        // Make a simpler query that should be faster
        const result = await query((client) => client.from("profiles").select("count"), { retryDelay: 300 })
        setRecoverySuccess(!!result)
      } catch (recoveryErr) {
        setRecoverySuccess(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Supabase Error Testing</CardTitle>
            <CardDescription>Test how the useSupabase hook handles various error scenarios</CardDescription>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isInitialized ? (isOnline ? "Online" : "Offline") : "Initializing..."}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="network">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="auth">Auth</TabsTrigger>
            <TabsTrigger value="permission">Permission</TabsTrigger>
            <TabsTrigger value="ratelimit">Rate Limit</TabsTrigger>
            <TabsTrigger value="server">Server</TabsTrigger>
            <TabsTrigger value="timeout">Timeout</TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="space-y-4">
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertTitle>Network Error Test</AlertTitle>
              <AlertDescription>
                Tests how the hook handles network connectivity issues. The hook should detect the network error, update
                the online status, and use the offline fallback if provided.
              </AlertDescription>
            </Alert>
            <Button onClick={testNetworkError} disabled={isLoading || !isInitialized}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Network Error
            </Button>
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>Authentication Error Test</AlertTitle>
              <AlertDescription>
                Tests how the hook handles authentication errors like expired tokens. The hook should attempt to refresh
                the token automatically.
              </AlertDescription>
            </Alert>
            <Button onClick={testAuthError} disabled={isLoading || !isInitialized}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Auth Error
            </Button>
          </TabsContent>

          <TabsContent value="permission" className="space-y-4">
            <Alert>
              <Ban className="h-4 w-4" />
              <AlertTitle>Permission Error Test</AlertTitle>
              <AlertDescription>
                Tests how the hook handles permission errors (403 Forbidden). These errors typically can't be recovered
                from automatically.
              </AlertDescription>
            </Alert>
            <Button onClick={testPermissionError} disabled={isLoading || !isInitialized}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Permission Error
            </Button>
          </TabsContent>

          <TabsContent value="ratelimit" className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Rate Limit Error Test</AlertTitle>
              <AlertDescription>
                Tests how the hook handles rate limiting (429 Too Many Requests). The hook should implement exponential
                backoff and retry after the specified delay.
              </AlertDescription>
            </Alert>
            <Button onClick={testRateLimitError} disabled={isLoading || !isInitialized}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Rate Limit Error
            </Button>
          </TabsContent>

          <TabsContent value="server" className="space-y-4">
            <Alert>
              <ServerCrash className="h-4 w-4" />
              <AlertTitle>Server Error Test</AlertTitle>
              <AlertDescription>
                Tests how the hook handles server errors (500 Internal Server Error). The hook should retry a few times
                with backoff before giving up.
              </AlertDescription>
            </Alert>
            <Button onClick={testServerError} disabled={isLoading || !isInitialized}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Server Error
            </Button>
          </TabsContent>

          <TabsContent value="timeout" className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Timeout Error Test</AlertTitle>
              <AlertDescription>
                Tests how the hook handles request timeouts. The hook should retry with a simpler query or abort after
                too many attempts.
              </AlertDescription>
            </Alert>
            <Button onClick={testTimeoutError} disabled={isLoading || !isInitialized}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Timeout Error
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {recoveryAttempted && (
          <Alert variant={recoverySuccess ? "default" : "destructive"} className="mt-4">
            {recoverySuccess ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{recoverySuccess ? "Recovery Successful" : "Recovery Failed"}</AlertTitle>
            <AlertDescription>
              {recoverySuccess
                ? "The hook successfully recovered from the error"
                : "The hook was unable to recover from the error"}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="p-4 bg-green-50 text-green-700 rounded-md mt-4">
            <p className="font-medium">Result</p>
            <pre className="text-xs mt-2 overflow-auto max-h-40">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
