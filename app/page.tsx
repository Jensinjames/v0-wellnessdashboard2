"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { Loader2 } from "lucide-react"

export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession()
        setSession(activeSession)

        if (activeSession) {
          // If user is logged in, redirect to dashboard
          window.location.href = "/dashboard"
          return
        }

        setLoading(false)
      } catch (error) {
        console.error("Error checking session:", error)
        setLoading(false)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        window.location.href = "/dashboard"
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-700">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome to Wellness Dashboard</h1>

        <div className="mb-8">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            redirectTo={`${window.location.origin}/auth/callback`}
          />
        </div>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>By signing in, you agree to our terms of service and privacy policy.</p>
        </div>
      </div>
    </div>
  )
}
