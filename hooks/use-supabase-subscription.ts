"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "./use-supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js"
import type { Database } from "@/types/database"

type Table = keyof Database["public"]["Tables"]
type Row<T extends Table> = Database["public"]["Tables"][T]["Row"]

interface SubscriptionState<T> {
  data: T[]
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to subscribe to real-time changes on a table
 */
export function useSupabaseSubscription<T extends Table>(
  table: T,
  filter?: (query: PostgrestFilterBuilder<any, any, any>) => PostgrestFilterBuilder<any, any, any>,
  options: { enabled?: boolean } = {},
): SubscriptionState<Row<T>> {
  const supabase = useSupabase()
  const [state, setState] = useState<SubscriptionState<Row<T>>>({
    data: [],
    isLoading: true,
    error: null,
  })
  const { enabled = true } = options

  useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    let subscription: RealtimeChannel
    let isMounted = true

    const fetchInitialData = async () => {
      try {
        let query = supabase.from(table).select("*")

        if (filter) {
          query = filter(query)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        if (isMounted) {
          setState({
            data: data as Row<T>[],
            isLoading: false,
            error: null,
          })
        }
      } catch (error) {
        console.error(`Error fetching initial data for ${table}:`, error)
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }))
        }
      }
    }

    const setupSubscription = () => {
      subscription = supabase
        .channel(`public:${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table: table as string }, (payload) => {
          if (!isMounted) return

          setState((current) => {
            // Handle different change types
            switch (payload.eventType) {
              case "INSERT":
                return {
                  ...current,
                  data: [...current.data, payload.new as Row<T>],
                }
              case "UPDATE":
                return {
                  ...current,
                  data: current.data.map((item: any) => (item.id === payload.new.id ? (payload.new as Row<T>) : item)),
                }
              case "DELETE":
                return {
                  ...current,
                  data: current.data.filter((item: any) => item.id !== payload.old.id),
                }
              default:
                return current
            }
          })
        })
        .subscribe((status) => {
          if (status !== "SUBSCRIBED") {
            console.error(`Subscription to ${table} failed with status: ${status}`)
          }
        })
    }

    fetchInitialData()
    setupSubscription()

    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [supabase, table, filter, enabled])

  return state
}

/**
 * Hook to subscribe to a single row by ID
 */
export function useSupabaseRowSubscription<T extends Table>(
  table: T,
  id: string | null,
  options: { enabled?: boolean } = {},
): {
  data: Row<T> | null
  isLoading: boolean
  error: Error | null
} {
  const supabase = useSupabase()
  const [state, setState] = useState<{
    data: Row<T> | null
    isLoading: boolean
    error: Error | null
  }>({
    data: null,
    isLoading: true,
    error: null,
  })
  const { enabled = true } = options

  useEffect(() => {
    if (!id || !enabled) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    let subscription: RealtimeChannel
    let isMounted = true

    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase.from(table).select("*").eq("id", id).single()

        if (error) {
          throw error
        }

        if (isMounted) {
          setState({
            data: data as Row<T>,
            isLoading: false,
            error: null,
          })
        }
      } catch (error) {
        console.error(`Error fetching initial data for ${table} with ID ${id}:`, error)
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }))
        }
      }
    }

    const setupSubscription = () => {
      subscription = supabase
        .channel(`public:${table}:id:${id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: table as string,
            filter: `id=eq.${id}`,
          },
          (payload) => {
            if (!isMounted) return

            switch (payload.eventType) {
              case "UPDATE":
                setState((current) => ({
                  ...current,
                  data: payload.new as Row<T>,
                }))
                break
              case "DELETE":
                setState((current) => ({
                  ...current,
                  data: null,
                }))
                break
            }
          },
        )
        .subscribe()
    }

    fetchInitialData()
    setupSubscription()

    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [supabase, table, id, enabled])

  return state
}
