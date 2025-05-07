"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient, resetSupabaseClient } from "@/lib/supabase-client-simplified"
import type { User, Session } from "@supabase/supabase-js"

export function useAuthSimplified() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const supabase = getSupabaseClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state change:", event)
      setSession(newSession)
      setUser(newSession?.user ?? null)

      // Refresh the page to update server components
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()

      // Reset the client to ensure a clean state
      resetSupabaseClient()

      // Redirect to sign-in page
      router.push("/auth/sign-in")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }, [router])

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  }
}
