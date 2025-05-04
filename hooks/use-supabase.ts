"use client"

import { getSupabaseClient } from "@/lib/supabase"
import { useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import type { RealtimeChannel } from "@supabase/supabase-js"

let supabaseInstance: SupabaseClient<Database> | null = null

export function useSupabase() {
  const [client] = useState(() => {
    if (!supabaseInstance) {
      supabaseInstance = getSupabaseClient()
    }
    return supabaseInstance
  })

  return client
}

/**
 * Hook to subscribe to Supabase realtime changes
 * @param table - The table to subscribe to
 * @param filter - Optional filter function
 * @returns The current data and loading state
 */
export function useSupabaseSubscription<T>(table: keyof Database["public"]["Tables"], filter?: (query: any) => any) {
  const supabase = useSupabase()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        setLoading(true)
        let query = supabase.from(table as string).select("*")

        // Apply filter if provided
        if (filter) {
          query = filter(query)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        setData(data as T[])
      } catch (err: any) {
        setError(err)
        console.error(`Error fetching data from ${table}:`, err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up realtime subscription
    let subscription: RealtimeChannel

    const setupSubscription = () => {
      subscription = supabase
        .channel(`public:${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table: table as string }, (payload) => {
          // Handle different change types
          switch (payload.eventType) {
            case "INSERT":
              setData((current) => [...current, payload.new as T])
              break
            case "UPDATE":
              setData((current) => current.map((item: any) => (item.id === payload.new.id ? (payload.new as T) : item)))
              break
            case "DELETE":
              setData((current) => current.filter((item: any) => item.id !== payload.old.id))
              break
          }
        })
        .subscribe()
    }

    setupSubscription()

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe()
    }
  }, [table, filter])

  return { data, loading, error }
}

/**
 * Hook to handle Supabase authentication state
 * @returns Authentication state and methods
 */
export function useSupabaseAuth() {
  const supabase = useSupabase()
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true)
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
        setUser(data.session?.user ?? null)
      } catch (error) {
        console.error("Error getting initial session:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { session, user, loading }
}
