"use client"

import { useEffect, useState } from "react"
import { SignInForm } from "@/components/auth/sign-in-form"
import { TokenDebugger } from "@/components/debug/token-debugger"
import { extractAuthToken } from "@/utils/auth-redirect"

export default function SignInPage() {
  const [showDebugger, setShowDebugger] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  // Only enable the debugger once on the client-side
  // to avoid hydration mismatches
  useEffect(() => {
    const isDevMode = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
    setShowDebugger(isDevMode)

    // Check if we have a token in the URL
    if (typeof window !== "undefined") {
      const token = extractAuthToken(window.location.href)
      setHasToken(!!token)
    }
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <SignInForm />

        {/* Show the token debugger in development or debug mode */}
        {(showDebugger || hasToken) && <TokenDebugger />}
      </div>
    </div>
  )
}
