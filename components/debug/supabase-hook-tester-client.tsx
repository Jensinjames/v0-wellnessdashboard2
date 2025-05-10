"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabase } from "@/hooks/use-supabase"
import { useSafeSearchParams } from "@/components/providers/search-params-provider"

export function SupabaseHookTesterClient() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = useSupabase()
  const searchParams = useSafeSearchParams()
  const testId = searchParams.get("testId") || "default"

  async function runTest() {
    setLoading(true)
    setError(null)
    try {
      // Simple test query
      const { data, error } = await supabase.from("profiles").select("id, email").limit(5)

      if (error) throw error
      setResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  // Run test automatically if testId is provided
  useEffect(() => {
    if (testId !== "default") {
      runTest()
    }
  }, [testId])

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Supabase Hook Test {testId !== "default" ? `(${testId})` : ""}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button onClick={runTest} disabled={loading}>
            {loading ? "Running Test..." : "Run Test Query"}
          </Button>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 text-red-800 rounded-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="font-semibold mb-2">Result:</p>
            <pre className="text-sm overflow-auto p-2 bg-gray-100 rounded">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
