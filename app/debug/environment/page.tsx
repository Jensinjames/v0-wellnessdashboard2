"use client"

import { useEffect, useState } from "react"
import { isClient, isDebugMode } from "@/utils/environment"

export default function EnvironmentDebugPage() {
  const [serverEnvStatus, setServerEnvStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Client-side environment variables
  const clientEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing",
    NEXT_PUBLIC_APP_ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "Not set (using default)",
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "Not set (using default)",
    NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE || "Not set (using default)",
    IS_CLIENT: isClient() ? "Yes" : "No",
    DEBUG_MODE: isDebugMode() ? "Enabled" : "Disabled",
  }

  useEffect(() => {
    async function fetchServerEnv() {
      try {
        setLoading(true)
        const response = await fetch("/api/debug/env-check")

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`)
        }

        const data = await response.json()
        setServerEnvStatus(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchServerEnv()
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Client-Side Environment Variables</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="whitespace-pre-wrap">{JSON.stringify(clientEnv, null, 2)}</pre>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Server-Side Environment Check</h2>
        {loading ? (
          <p>Loading server environment status...</p>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap">{JSON.stringify(serverEnvStatus, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-700 mb-2">Troubleshooting Tips</h3>
        <ul className="list-disc pl-5 space-y-1 text-blue-800">
          <li>If variables are missing, check your Vercel project settings</li>
          <li>After adding variables, redeploy your application</li>
          <li>Make sure client-side variables have the NEXT_PUBLIC_ prefix</li>
          <li>Server-side variables should not have the NEXT_PUBLIC_ prefix</li>
          <li>Check for any typos in variable names</li>
        </ul>
      </div>
    </div>
  )
}
