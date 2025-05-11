"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import type { Database } from "@/types/database"
import { AuthContext } from "@/context/auth-context"

// Create a Supabase client for use in the browser
const createBrowserClient = () => createClientComponentClient<Database>()

// Context to provide Supabase client
export const SupabaseContext = createContext<ReturnType<typeof createBrowserClient> | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createBrowserClient())
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <SupabaseContext.Provider value={supabase}>
      <AuthContext>{children}</AuthContext>
    </SupabaseContext.Provider>
  )
}

// Hook to use Supabase client
export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}
