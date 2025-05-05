import { getSupabaseClient } from "./supabase-client"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type SubscriptionCallback<T> = (payload: RealtimePostgresChangesPayload<T>) => void
type SubscriptionCleanup = () => void

/**
 * Subscribe to real-time changes on a Supabase table
 *
 * @param table The table name to subscribe to
 * @param event The event type to subscribe to (INSERT, UPDATE, DELETE, or *)
 * @param callback The callback function to execute when an event occurs
 * @param filter Optional filter function to filter events
 * @returns A cleanup function to unsubscribe
 */
export function subscribeToTable<T = any>(
  table: string,
  event: "INSERT" | "UPDATE" | "DELETE" | "*",
  callback: SubscriptionCallback<T>,
  filter?: {
    column: string
    value: any
  },
): SubscriptionCleanup {
  const supabase = getSupabaseClient()

  // Create a channel with a unique name
  const channelId = `${table}_${event}_${Math.random().toString(36).substring(2, 9)}`
  let channel: RealtimeChannel

  // Build the subscription
  const subscription = supabase
    .channel(channelId)
    .on(
      "postgres_changes",
      {
        event: event,
        schema: "public",
        table: table,
        ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
      },
      callback,
    )
    .subscribe((status) => {
      if (status !== "SUBSCRIBED") {
        console.error(`Failed to subscribe to ${table} changes:`, status)
      }
    })

  // Return a cleanup function
  return () => {
    supabase.removeChannel(subscription)
  }
}

/**
 * Subscribe to real-time changes on multiple Supabase tables
 *
 * @param subscriptions Array of subscription configurations
 * @returns A cleanup function to unsubscribe from all subscriptions
 */
export function subscribeToMultipleTables(
  subscriptions: Array<{
    table: string
    event: "INSERT" | "UPDATE" | "DELETE" | "*"
    callback: SubscriptionCallback<any>
    filter?: {
      column: string
      value: any
    }
  }>,
): SubscriptionCleanup {
  const cleanupFunctions = subscriptions.map((sub) => subscribeToTable(sub.table, sub.event, sub.callback, sub.filter))

  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup())
  }
}
