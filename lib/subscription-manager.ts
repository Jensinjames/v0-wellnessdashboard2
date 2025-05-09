import type { RealtimeChannel, RealtimeChannelOptions, SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { isomorphicCache, CACHE_EXPIRY } from "@/hooks/isomorphic-cache"

// Subscription status
export enum SubscriptionStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  ERROR = "ERROR",
  CLOSED = "CLOSED",
}

// Subscription metadata
export interface SubscriptionMeta {
  id: string
  table: string
  filter?: string
  status: SubscriptionStatus
  lastUpdated: number
  subscribers: number
  errorCount: number
  lastError?: string
  lastEvent?: string
}

// Subscription instance
export interface SubscriptionInstance {
  id: string
  channel: RealtimeChannel
  meta: SubscriptionMeta
  cacheKey: string
  options: RealtimeChannelOptions
}

// Subscription manager
class SubscriptionManager {
  private subscriptions: Map<string, SubscriptionInstance> = new Map()
  private debug: boolean

  constructor(debug = false) {
    this.debug = debug
  }

  // Generate a subscription ID based on table and filter
  private generateSubscriptionId(table: string, filter?: string): string {
    return `${table}:${filter || "*"}`
  }

  // Generate a cache key for subscription data
  private generateCacheKey(table: string, filter?: string): string {
    return `rt:${table}:${filter || "*"}`
  }

  // Log debug messages
  private log(...args: any[]): void {
    if (this.debug) {
      console.log("[SubscriptionManager]", ...args)
    }
  }

  // Create or get a subscription
  subscribe<T = any>(
    client: SupabaseClient<Database>,
    table: string,
    callback: (payload: T) => void,
    options: {
      event?: "INSERT" | "UPDATE" | "DELETE" | "*"
      filter?: string
      schema?: string
      config?: RealtimeChannelOptions
    } = {},
  ): { unsubscribe: () => void; status: () => SubscriptionStatus } {
    const { event = "*", filter, schema = "public", config = {} } = options
    const subscriptionId = this.generateSubscriptionId(table, filter)
    const cacheKey = this.generateCacheKey(table, filter)

    // Check if we already have this subscription
    if (this.subscriptions.has(subscriptionId)) {
      const existingSubscription = this.subscriptions.get(subscriptionId)!

      // Increment subscriber count
      existingSubscription.meta.subscribers++
      existingSubscription.meta.lastUpdated = Date.now()

      this.log(
        `Reusing existing subscription: ${subscriptionId}, subscribers: ${existingSubscription.meta.subscribers}`,
      )

      // Get cached data if available and call callback immediately
      const cachedData = isomorphicCache.get<T[]>(cacheKey)
      if (cachedData) {
        this.log(`Using cached data for ${subscriptionId}`)
        setTimeout(() => callback(cachedData as T), 0)
      }

      // Return unsubscribe function
      return {
        unsubscribe: () => this.unsubscribe(subscriptionId),
        status: () => existingSubscription.meta.status,
      }
    }

    // Create a new subscription
    this.log(`Creating new subscription: ${subscriptionId}`)

    // Set up the channel
    const channel = client
      .channel(subscriptionId, config)
      .on(
        "postgres_changes",
        {
          event,
          schema,
          table,
          filter,
        },
        async (payload) => {
          this.log(`Received event for ${subscriptionId}:`, payload.eventType)

          // Update subscription metadata
          const subscription = this.subscriptions.get(subscriptionId)
          if (subscription) {
            subscription.meta.lastEvent = payload.eventType
            subscription.meta.lastUpdated = Date.now()
          }

          // Get current cached data
          let currentData = isomorphicCache.get<T[]>(cacheKey) || []

          // Update cache based on event type
          switch (payload.eventType) {
            case "INSERT":
              currentData = [...currentData, payload.new as T]
              break
            case "UPDATE":
              currentData = currentData.map((item: any) =>
                item.id === (payload.new as any).id ? (payload.new as T) : item,
              )
              break
            case "DELETE":
              currentData = currentData.filter((item: any) => item.id !== (payload.old as any).id)
              break
          }

          // Update cache
          isomorphicCache.set(cacheKey, currentData, CACHE_EXPIRY.LONG)

          // Call callback with updated data
          callback(currentData as T)
        },
      )
      .subscribe((status) => {
        const subscription = this.subscriptions.get(subscriptionId)
        if (!subscription) return

        if (status === "SUBSCRIBED") {
          this.log(`Subscription ${subscriptionId} connected`)
          subscription.meta.status = SubscriptionStatus.CONNECTED

          // Fetch initial data if not in cache
          if (!isomorphicCache.get(cacheKey)) {
            this.fetchInitialData(client, table, filter, cacheKey)
              .then((data) => {
                if (data) {
                  callback(data as T)
                }
              })
              .catch((error) => {
                this.log(`Error fetching initial data for ${subscriptionId}:`, error)
                subscription.meta.errorCount++
                subscription.meta.lastError = error.message
              })
          }
        } else if (status === "CHANNEL_ERROR") {
          this.log(`Subscription ${subscriptionId} error`)
          subscription.meta.status = SubscriptionStatus.ERROR
          subscription.meta.errorCount++
        } else if (status === "CLOSED") {
          this.log(`Subscription ${subscriptionId} closed`)
          subscription.meta.status = SubscriptionStatus.CLOSED
        } else if (status === "TIMED_OUT") {
          this.log(`Subscription ${subscriptionId} timed out`)
          subscription.meta.status = SubscriptionStatus.ERROR
          subscription.meta.errorCount++
          subscription.meta.lastError = "Connection timed out"
        }
      })

    // Create subscription metadata
    const meta: SubscriptionMeta = {
      id: subscriptionId,
      table,
      filter,
      status: SubscriptionStatus.CONNECTING,
      lastUpdated: Date.now(),
      subscribers: 1,
      errorCount: 0,
    }

    // Store the subscription
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      channel,
      meta,
      cacheKey,
      options: config,
    })

    // Get cached data if available and call callback immediately
    const cachedData = isomorphicCache.get<T[]>(cacheKey)
    if (cachedData) {
      this.log(`Using cached data for ${subscriptionId}`)
      setTimeout(() => callback(cachedData as T), 0)
    } else {
      // Fetch initial data
      this.fetchInitialData(client, table, filter, cacheKey)
        .then((data) => {
          if (data) {
            callback(data as T)
          }
        })
        .catch((error) => {
          this.log(`Error fetching initial data for ${subscriptionId}:`, error)
          const subscription = this.subscriptions.get(subscriptionId)
          if (subscription) {
            subscription.meta.errorCount++
            subscription.meta.lastError = error.message
          }
        })
    }

    // Return unsubscribe function
    return {
      unsubscribe: () => this.unsubscribe(subscriptionId),
      status: () => this.getStatus(subscriptionId),
    }
  }

  // Unsubscribe from a subscription
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      this.log(`Subscription not found: ${subscriptionId}`)
      return false
    }

    // Decrement subscriber count
    subscription.meta.subscribers--
    this.log(`Unsubscribing from ${subscriptionId}, remaining subscribers: ${subscription.meta.subscribers}`)

    // If no more subscribers, remove the subscription
    if (subscription.meta.subscribers <= 0) {
      this.log(`Removing subscription: ${subscriptionId}`)
      subscription.channel.unsubscribe()
      this.subscriptions.delete(subscriptionId)
    }

    return true
  }

  // Get subscription status
  getStatus(subscriptionId: string): SubscriptionStatus {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      return SubscriptionStatus.INACTIVE
    }
    return subscription.meta.status
  }

  // Get all subscription metadata
  getSubscriptions(): SubscriptionMeta[] {
    return Array.from(this.subscriptions.values()).map((sub) => sub.meta)
  }

  // Fetch initial data for a subscription
  private async fetchInitialData<T = any>(
    client: SupabaseClient<Database>,
    table: string,
    filter?: string,
    cacheKey?: string,
  ): Promise<T[] | null> {
    try {
      this.log(`Fetching initial data for ${table}${filter ? ` with filter ${filter}` : ""}`)

      let query = client.from(table).select("*")

      // Apply filter if provided
      if (filter) {
        // Parse filter string (format: "column=value")
        const [column, value] = filter.split("=")
        if (column && value) {
          query = query.eq(column.trim(), value.trim())
        }
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      if (data && cacheKey) {
        this.log(`Caching initial data for ${cacheKey}`)
        isomorphicCache.set(cacheKey, data, CACHE_EXPIRY.LONG)
      }

      return data as T[]
    } catch (error) {
      this.log("Error fetching initial data:", error)
      return null
    }
  }

  // Reconnect all subscriptions
  reconnectAll(client: SupabaseClient<Database>): void {
    this.log(`Reconnecting all subscriptions (${this.subscriptions.size})`)

    for (const [id, subscription] of this.subscriptions.entries()) {
      this.log(`Reconnecting ${id}`)

      // Unsubscribe from current channel
      subscription.channel.unsubscribe()

      // Create a new channel with the same options
      const newChannel = client
        .channel(id, subscription.options)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: subscription.meta.table,
            filter: subscription.meta.filter,
          },
          (payload) => {
            this.log(`Received event for ${id}:`, payload.eventType)

            // Update subscription metadata
            const sub = this.subscriptions.get(id)
            if (sub) {
              sub.meta.lastEvent = payload.eventType
              sub.meta.lastUpdated = Date.now()
            }

            // Update cache based on event type
            let currentData = isomorphicCache.get(subscription.cacheKey) || []

            switch (payload.eventType) {
              case "INSERT":
                currentData = [...currentData, payload.new]
                break
              case "UPDATE":
                currentData = currentData.map((item: any) => (item.id === (payload.new as any).id ? payload.new : item))
                break
              case "DELETE":
                currentData = currentData.filter((item: any) => item.id !== (payload.old as any).id)
                break
            }

            // Update cache
            isomorphicCache.set(subscription.cacheKey, currentData, CACHE_EXPIRY.LONG)
          },
        )
        .subscribe()

      // Update subscription with new channel
      subscription.channel = newChannel
      subscription.meta.status = SubscriptionStatus.CONNECTING
      subscription.meta.lastUpdated = Date.now()
    }
  }

  // Clear all subscriptions
  clearAll(): void {
    this.log(`Clearing all subscriptions (${this.subscriptions.size})`)

    for (const [id, subscription] of this.subscriptions.entries()) {
      subscription.channel.unsubscribe()
    }

    this.subscriptions.clear()
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager(process.env.NODE_ENV === "development")
