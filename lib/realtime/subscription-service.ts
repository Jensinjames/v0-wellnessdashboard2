"use client"

import { createBrowserClient } from "@/lib/supabase"
import { useEffect, useState } from "react"

export type SubscriptionCallback<T> = (payload: T) => void
export type ErrorCallback = (error: Error) => void

export type SubscriptionOptions = {
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  schema?: string
  filterColumn?: string
  filterValue?: string | number
}

/**
 * Creates a subscription to a Supabase table
 * @param table The table to subscribe to
 * @param callback The callback to execute when data changes
 * @param options Subscription options
 * @returns A function to unsubscribe
 */
export function subscribeToTable<T>(
  table: string,
  callback: SubscriptionCallback<T>,
  errorCallback?: ErrorCallback,
  options: SubscriptionOptions = {},
): () => void {
  const supabase = createBrowserClient()
  const { event = "*", schema = "public", filterColumn, filterValue } = options

  // Create the subscription
  const subscription = supabase
    .channel(`${table}_changes`)
    .on(
      "postgres_changes",
      {
        event,
        schema,
        table,
        ...(filterColumn && filterValue ? { filter: `${filterColumn}=eq.${filterValue}` } : {}),
      },
      (payload) => {
        try {
          callback(payload.new as T)
        } catch (error) {
          console.error(`Error in subscription callback for ${table}:`, error)
          if (errorCallback && error instanceof Error) {
            errorCallback(error)
          }
        }
      },
    )
    .subscribe((status) => {
      if (status === "SUBSCRIPTION_ERROR" && errorCallback) {
        errorCallback(new Error(`Failed to subscribe to ${table}`))
      }
    })

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(subscription)
  }
}

/**
 * Hook to subscribe to real-time updates for a table
 * @param table The table to subscribe to
 * @param options Subscription options
 * @returns [isConnected, error]
 */
export function useRealtimeSubscription(
  table: string,
  callback: SubscriptionCallback<any>,
  options: SubscriptionOptions = {},
): [boolean, Error | null] {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    let mounted = true

    // Use requestIdleCallback to defer subscription setup
    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1))
    const idleHandle = idleCallback(() => {
      if (!mounted) return

      try {
        unsubscribe = subscribeToTable(
          table,
          (payload) => {
            if (mounted) {
              callback(payload)
            }
          },
          (err) => {
            if (mounted) {
              setError(err)
              setIsConnected(false)
            }
          },
          options,
        )
        setIsConnected(true)
        setError(null)
      } catch (err) {
        console.error(`Error setting up subscription to ${table}:`, err)
        if (mounted) {
          setError(err instanceof Error ? err : new Error(`Failed to subscribe to ${table}`))
          setIsConnected(false)
        }
      }
    })

    return () => {
      mounted = false
      if (typeof window !== "undefined" && window.cancelIdleCallback) {
        window.cancelIdleCallback(idleHandle)
      }
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [table, JSON.stringify(options)])

  return [isConnected, error]
}

/**
 * Hook to subscribe to real-time updates for a specific record
 * @param table The table to subscribe to
 * @param id The ID of the record
 * @param callback The callback to execute when data changes
 * @returns [isConnected, error]
 */
export function useRealtimeRecord<T>(
  table: string,
  id: string,
  callback: SubscriptionCallback<T>,
): [boolean, Error | null] {
  return useRealtimeSubscription(table, callback, {
    event: "*",
    filterColumn: "id",
    filterValue: id,
  })
}

/**
 * Hook to subscribe to real-time updates for user-specific data
 * @param table The table to subscribe to
 * @param userId The user ID
 * @param callback The callback to execute when data changes
 * @returns [isConnected, error]
 */
export function useRealtimeUserData<T>(
  table: string,
  userId: string,
  callback: SubscriptionCallback<T>,
): [boolean, Error | null] {
  return useRealtimeSubscription(table, callback, {
    event: "*",
    filterColumn: "user_id",
    filterValue: userId,
  })
}
