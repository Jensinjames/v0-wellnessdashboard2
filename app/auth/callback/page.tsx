"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase-client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [success, setSuccess] = useState<boolean>(false)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient()

        // Get the auth code from the URL
        const code = searchParams.get("code")

        if (!code) {
          setError("No authentication code found in the URL")
          setLoading(false)
          return
        }

        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        // Success - session is now set in the browser
        setSuccess(true)
        setLoading(false)

        // Redirect to the dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } catch (err) {
        console.error("Error handling auth callback:", err)
        setError("An unexpected error occurred")
        setLoading(false)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Authentication</CardTitle>
          <CardDescription className="text-center">
            {loading
              ? "Processing your authentication..."
              : success
                ? "Authentication successful!"
                : "Authentication failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
          {loading && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Please wait while we authenticate you...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-sm text-muted-foreground">
                Authentication successful! You will be redirected to the dashboard shortly.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
