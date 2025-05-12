"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      try {
        const supabase = createBrowserClient()

        // Get the auth code from the URL
        const code = searchParams.get("code")

        // If there's no code, this isn't an auth callback
        if (!code) {
          // Check if there's an error in the URL
          const errorDescription = searchParams.get("error_description")
          if (errorDescription) {
            throw new Error(errorDescription)
          }
          throw new Error("No code found in URL")
        }

        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          throw error
        }

        // Check if there's a next parameter to redirect to
        const next = searchParams.get("next")
        if (next) {
          router.push(next)
        } else {
          // Default redirect to profile page
          router.push("/profile")
        }
      } catch (err) {
        console.error("Error handling auth callback:", err)
        setError(err instanceof Error ? err.message : "An error occurred during authentication")
      } finally {
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">
          {isProcessing ? "Completing authentication..." : error ? "Authentication Error" : "Authentication Successful"}
        </h1>

        {error ? (
          <div className="p-4 text-red-700 bg-red-100 rounded-md">
            <p>{error}</p>
            <button
              onClick={() => router.push("/auth/login")}
              className="mt-4 w-full py-2 px-4 bg-primary text-white rounded hover:bg-primary/90"
            >
              Back to login
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            {isProcessing && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>}
          </div>
        )}
      </div>
    </div>
  )
}
