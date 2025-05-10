"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSupabase } from "./use-supabase"
import { subscriptionManager, SubscriptionStatus } from "@/lib/subscription-manager"
import type { RealtimeChannelOptions } from "@supabase/supabase-js"

interface UseRealtimeSubscriptionOptions {
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  filter?: string
  schema?: string
  config?: RealtimeChannelOptions
  enabled?: boolean
}

export function useRealtimeSubscription<T = any>(table: string, options: UseRealtimeSubscriptionOptions = {}) {
  const { event = "*", filter, schema = "public", config = {}, enabled = true } = options

  const { supabase, isInitialized, isOnline } = useSupabase()
  const [data, setData] = useState<T[] | null>(null)
  const [status, setStatus] = useState<SubscriptionStatus>(SubscriptionStatus.INACTIVE)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const unsubscribeFnRef = useRef<(() => void) | null>(null)

  // Handle subscription callback
  const handleSubscriptionData = useCallback((newData: T[]) => {
    setData(newData)
    setIsLoading(false)
    setError(null)
  }, [])

  // Subscribe to changes
  useEffect(() => {
    if (!isInitialized || !supabase || !enabled) {
      return
    }

    setIsLoading(true)

    try {
      const { unsubscribe, status: getStatus } = subscriptionManager.subscribe<T[]>(
        supabase,
        table,
        handleSubscriptionData,
        {
          event,
          filter,
          schema,
          config,
        },
      )

      // Store unsubscribe function
      unsubscribeFnRef.current = unsubscribe

      // Set initial status
      setStatus(getStatus())

      // Set up status polling
      const statusInterval = setInterval(() => {
        const currentStatus = getStatus()
        setStatus(currentStatus)

        // If we're in an error state, try to reconnect
        if (currentStatus === SubscriptionStatus.ERROR && isOnline && unsubscribeFnRef.current) {
          unsubscribeFnRef.current()

          const { unsubscribe: newUnsubscribe, status: newGetStatus } = subscriptionManager.subscribe<T[]>(
            supabase,
            table,
            handleSubscriptionData,
            {
              event,
              filter,
              schema,
              config,
            },
          )

          unsubscribeFnRef.current = newUnsubscribe
          setStatus(newGetStatus())
        }
      }, 5000)

      return () => {
        clearInterval(statusInterval)
        if (unsubscribeFnRef.current) {
          unsubscribeFnRef.current()
          unsubscribeFnRef.current = null
        }
      }
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err.message || "Unknown error"))
      setIsLoading(false)
      setStatus(SubscriptionStatus.ERROR)
      return undefined
    }
  }, [supabase, isInitialized, isOnline, table, event, filter, schema, config, enabled, handleSubscriptionData])

  // Manually refresh data
  const refresh = useCallback(async () => {
    if (!supabase) return

    setIsLoading(true)
    setError(null)

    try {
      let query = supabase.from(table).select("*")

      // Apply filter if provided
      if (filter) {
        // Parse filter string (format: "column=value")
        const [column, value] = filter.split("=")
        if (column && value) {
          query = query.eq(column.trim(), value.trim())
        }
      }

      const { data: freshData, error } = await query

      if (error) {
        throw error
      }

      setData(freshData as T[])
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }, [supabase, table, filter])

  return {
    data,
    error,
    isLoading,
    status,
    refresh,
  }
}
