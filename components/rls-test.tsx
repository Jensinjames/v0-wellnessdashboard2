"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RLSTest() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const testRLS = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/rls-test")
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Error testing RLS:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RLS Policy Test</CardTitle>
        <CardDescription>Test if Row Level Security policies are working correctly</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={testRLS} disabled={loading}>
          {loading ? "Testing..." : "Test RLS Policies"}
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium">Test Results:</h3>
            <div className="mt-2 space-y-2 text-sm">
              <div>
                <span className="font-medium">Own Profile Access:</span>
                <span className={results.ownProfile.success ? "text-green-600" : "text-red-600"}>
                  {results.ownProfile.success ? " Success" : " Failed"}
                </span>
                {results.ownProfile.error && <p className="text-red-500">{results.ownProfile.error}</p>}
              </div>

              <div>
                <span className="font-medium">Other Profiles Access:</span>
                <span className={!results.otherProfiles.success ? "text-green-600" : "text-red-600"}>
                  {!results.otherProfiles.success ? " Correctly Blocked" : " Security Issue!"}
                </span>
                {results.otherProfiles.error && <p className="text-xs text-gray-500">{results.otherProfiles.error}</p>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
