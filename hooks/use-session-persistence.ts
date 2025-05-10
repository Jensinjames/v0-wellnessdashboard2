"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-client"

export function useSessionPersistence() {
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        // Refresh the page to update server components
        router.refresh()
      } else if (event === "SIGNED_OUT") {
        // Clear any cached data and redirect to login
        router.push("/auth/sign-in")
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])
}
