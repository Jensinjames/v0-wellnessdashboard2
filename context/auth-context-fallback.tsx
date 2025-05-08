"use client"

/**
 * Fallback Auth Context
 * Used when the database schema is not properly set up
 */
import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { User, Session } from "@supabase/supabase-js"

const logger = createLogger("AuthContextFallback")

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProviderFallback({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient()

      logger.info("Attempting to sign in with fallback auth context")

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logger.error("Sign in error:", error)
        return { success: false, error: error.message }
      }

      setSession(data.session)
      setUser(data.user)

      return { success: true }
    } catch (error) {
      logger.error("Unexpected sign in error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
  }

  return <AuthContext.Provider value={{ user, session, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuthFallback() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthFallback must be used within an AuthProviderFallback")
  }
  return context
}
