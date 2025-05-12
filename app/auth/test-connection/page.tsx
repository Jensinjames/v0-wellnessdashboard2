"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseClient } from "@/hooks/auth"

export default function TestConnectionPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState<any>(null)

  const testConnection = async () => {
    setStatus("loading")
    setMessage("Testing connection to Supabase...")
    setDetails(null)

    try {
      const supabase = getSupabaseClient()

      // Test 1: Get Supabase health
      const { data: healthData, error: healthError } = await supabase.from("_health").select("*").limit(1)

      if (healthError) {
        setStatus("error")
        setMessage("Failed to connect to Supabase")
        setDetails({
          error: healthError,
          message: "Health check failed",
        })
        return
      }

      // Test 2: Get auth configuration
      const { data: authData, error: authError } = await supabase.auth.getSession()

      if (authError) {
        setStatus("error")
        setMessage("Failed to get auth session")
        setDetails({
          error: authError,
          message: "Auth check failed",
        })
        return
      }

      // All tests passed
      setStatus("success")
      setMessage("Successfully connected to Supabase")
      setDetails({
        health: healthData,
        auth: authData,
        env: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
        },
      })
    } catch (error) {
      setStatus("error")
      setMessage("An unexpected error occurred")
      setDetails({
        error,
        message: "Unexpected error",
      })
    }
  }

  useEffect(() => {
    // Test connection on mount
    testConnection()
  }, [])

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant={status === "success" ? "default" : status === "error" ? "destructive" : "default"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          {details && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <details open>
                <summary className="cursor-pointer font-medium">Connection Details</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs">{JSON.stringify(details, null, 2)}</pre>
              </details>
            </div>
          )}

          <Button onClick={testConnection} disabled={status === "loading"}>
            {status === "loading" ? "Testing..." : "Test Connection Again"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
