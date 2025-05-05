"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { WellnessCategory } from "@/types/wellness"
import { fetchCategories } from "@/services/categories-service"
import { useAuth } from "@/context/auth-context"

type SupabaseContextType = {
  categories: WellnessCategory[]
  loading: boolean
  error: Error | null
  refreshCategories: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<WellnessCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  const refreshCategories = async () => {
    if (!user) {
      setCategories([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await fetchCategories(user.id)

      // Transform data to match our WellnessCategory type
      // Note: We'll need to fetch metrics separately and add them
      const transformedCategories: WellnessCategory[] = data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        enabled: cat.enabled,
        metrics: [], // We'll populate this separately
      }))

      setCategories(transformedCategories)
      setError(null)
    } catch (err) {
      console.error("Error refreshing categories:", err)
      setError(err instanceof Error ? err : new Error("Unknown error occurred"))
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (user) {
      refreshCategories()
    }
  }, [user])

  // Set up real-time subscription for categories
  useEffect(() => {
    if (!user) return

    const supabase = getSupabaseClient()

    const subscription = supabase
      .channel("categories-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshCategories()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return (
    <SupabaseContext.Provider value={{ categories, loading, error, refreshCategories }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}
