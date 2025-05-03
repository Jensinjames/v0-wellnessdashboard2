"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface AuthErrorHandlerProps {
  children: React.ReactNode
}

export function AuthErrorHandler({ children }: AuthErrorHandlerProps) {
  const router = useRouter()

  useEffect(() => {
    // Listen for auth errors
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") {
        // Token was refreshed successfully
        console.log("Auth token refreshed successfully")
      }

      if (event === "SIGNED_OUT") {
        // User signed out
        router.push("/login")
      }
    })

    // Set up error listener for auth errors
    const authErrorListener = supabase.auth.onError((error) => {
      console.error("Supabase auth error:", error)

      // Handle specific auth errors
      if (error.message.includes("token is expired")) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please sign in again.",
          variant: "destructive",
        })

        // Redirect to login
        router.push("/login")
      } else if (error.message.includes("not authenticated")) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to continue.",
          variant: "destructive",
        })

        // Redirect to login
        router.push("/login")
      } else {
        // Generic auth error
        toast({
          title: "Authentication Error",
          description: error.message || "An authentication error occurred.",
          variant: "destructive",
        })
      }
    })

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe()
      authErrorListener.unsubscribe()
    }
  }, [router])

  return <>{children}</>
}
