"use client"

import { useState, useEffect, useCallback } from "react"
import { useRealtimeSubscription } from "./use-realtime-subscription"
import type { SubscriptionStatus } from "@/lib/subscription-manager"
import type { RealtimeChannelOptions } from "@supabase/supabase-js"

interface UseRealtimeItemOptions {
  schema?: string
  config?: RealtimeChannelOptions
  enabled?: boolean
}

export function useRealtimeItem<T extends { id: string | number }>(
  table: string,
  id: string | number | null | undefined,
  options: UseRealtimeItemOptions = {},
) {
  const { schema = "public", config = {}, enabled = true } = options

  const [item, setItem] = useState<T | null>(null)

  // Only enable subscription if we have an ID
  const isEnabled = enabled && !!id

  // Subscribe to changes for this specific item
  const { data, error, isLoading, status, refresh } = useRealtimeSubscription<T>(table, {
    filter: id ? `id=${id}` : undefined,
    schema,
    config,
    enabled: isEnabled,
  })

  // Update item when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      setItem(data[0])
    } else if (data && data.length === 0) {
      setItem(null)
    }
  }, [data])

  // Manually refresh data
  const refreshItem = useCallback(async () => {
    await refresh()
  }, [refresh])

  return {
    item,
    error,
    isLoading: isLoading && isEnabled,
    status: isEnabled ? status : ("DISABLED" as SubscriptionStatus),
    refresh: refreshItem,
  }
}
