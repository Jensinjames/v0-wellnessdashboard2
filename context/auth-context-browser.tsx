"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { Session, User } from "@supabase/supabase-js"

// Define the context type
type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
})

// Export the provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize the auth state
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    // Get the initial session
    const initializeAuth = async () => {
      setIsLoading(true)
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Call the initialization function
    initializeAuth()

    // Set up the auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setIsLoading(false)
    })

    // Clean up the subscription when the component unmounts
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Sign out function
  const signOut = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
  }

  // Refresh session function
  const refreshSession = async () => {
    const supabase = createSupabaseBrowserClient()
    const {
      data: { session: refreshedSession },
    } = await supabase.auth.getSession()
    setSession(refreshedSession)
    setUser(refreshedSession?.user ?? null)
  }

  // Provide the auth context to children
  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

// Export the hook for using the auth context
export function useAuth() {
  return useContext(AuthContext)
}
