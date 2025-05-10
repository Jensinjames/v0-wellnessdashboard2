"use client"

import { useState } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

export function SupabaseHookTester() {
  const { supabase, isInitialized, isOnline, query, refreshToken, getTokenStatus } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<any>(null)

  const testQuery = async () => {
    if (!isInitialized) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Simple health check query
      const result = await query((client) => client.from("profiles").select("count").limit(1), { requiresAuth: false })

      setResult(result)
    } catch (err: any) {
      console.error("Error testing query:", err)
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const testTokenRefresh = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const success = await refreshToken()
      setResult({ tokenRefreshed: success })
    } catch (err: any) {
      console.error("Error refreshing token:", err)
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const checkTokenStatus = () => {
    const status = getTokenStatus()
    setTokenInfo(status)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Supabase Hook Tester
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isInitialized ? (isOnline ? "Online" : "Offline") : "Initializing..."}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={testQuery} disabled={isLoading || !isInitialized}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Query
          </Button>

          <Button onClick={testTokenRefresh} disabled={isLoading || !isInitialized} variant="outline">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Token Refresh
          </Button>

          <Button onClick={checkTokenStatus} disabled={!isInitialized} variant="secondary">
            Check Token Status
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 text-green-700 rounded-md">
            <p className="font-medium">Result</p>
            <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        {tokenInfo && (
          <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
            <p className="font-medium">Token Status</p>
            <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(tokenInfo, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
