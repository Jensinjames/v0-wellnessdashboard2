"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

interface AuthFallbackProps {
  operation: string
  message?: string
}

export function AuthFallback({ operation, message }: AuthFallbackProps) {
  const [showDebug, setShowDebug] = useState(false)

  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200">
        <AlertDescription>
          {message || `Unable to complete ${operation}. The authentication service is currently unavailable.`}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col space-y-2">
        <Button asChild>
          <Link href="/auth/sign-in">Return to Sign In</Link>
        </Button>

        {process.env.NODE_ENV === "development" && (
          <Button variant="outline" onClick={() => setShowDebug(!showDebug)}>
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </Button>
        )}
      </div>

      {showDebug && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md text-xs font-mono overflow-auto max-h-60">
          <h4 className="font-bold mb-2">Debug Information:</h4>
          <p>Operation: {operation}</p>
          <p>Environment: {process.env.NODE_ENV}</p>
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not Set"}</p>
          <p>Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not Set"}</p>
          <p>Browser: {typeof window !== "undefined" ? window.navigator.userAgent : "SSR"}</p>
        </div>
      )}
    </div>
  )
}
