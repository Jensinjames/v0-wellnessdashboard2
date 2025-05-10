"use client"

import { useState, useEffect, useCallback } from "react"
import { getRequestBatcher } from "@/lib/request-batcher"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

type BatchOptions = {
  priority?: "high" | "medium" | "low"
  category?: string
  retryOnNetworkError?: boolean
  maxRetries?: number
}

// Function to get the Supabase client
const getSupabaseClient = () => {
  return createClientComponentClient()
}

export function useBatchedSupabase() {
  const [batcherStatus, setBatcherStatus] = useState({
    queueLength: 0,
    activeBatches: 0,
    paused: false,
    rateLimited: false,
  })

  // Get the request batcher instance
  const batcher = getRequestBatcher()

  // Update status when it changes
  useEffect(() => {
    const updateStatus = () => {
      setBatcherStatus(batcher.getStatus())
    }

    // Listen for batcher events
    batcher.on("queued", updateStatus)
    batcher.on("batchStart", updateStatus)
    batcher.on("batchComplete", updateStatus)
    batcher.on("rateLimited", updateStatus)
    batcher.on("rateLimitReset", updateStatus)
    batcher.on("paused", updateStatus)
    batcher.on("resumed", updateStatus)
    batcher.on("cleared", updateStatus)

    // Initial status
    updateStatus()

    return () => {
      // Remove event listeners
      batcher.off("queued", updateStatus)
      batcher.off("batchStart", updateStatus)
      batcher.off("batchComplete", updateStatus)
      batcher.off("rateLimited", updateStatus)
      batcher.off("rateLimitReset", updateStatus)
      batcher.off("paused", updateStatus)
      batcher.off("resumed", updateStatus)
      batcher.off("cleared", updateStatus)
    }
  }, [batcher])

  // Execute a function in a batch
  const executeBatched = useCallback(
    <T>(executeFunction: () => Promise<T>, options: BatchOptions = {}): Promise<T> => {
      return batcher.add(executeFunction, options)
    },
    [batcher],
  )

  // Execute a Supabase query in a batch
  const executeBatchedQuery = useCallback(
    async <T>(
      queryFn: (supabase: ReturnType<typeof createClientComponentClient>) => Promise<T>,
      options: BatchOptions = {},
    ): Promise<T> => {
      return batcher.add(
        async () => {
          const supabase = getSupabaseClient()
          return queryFn(supabase)
        },
        { ...options, category: options.category || "database" },
      )
    },
    [batcher],
  )

  // Pause the batcher
  const pauseBatcher = useCallback(() => {
    batcher.pause()
    setBatcherStatus(batcher.getStatus())
  }, [batcher])

  // Resume the batcher
  const resumeBatcher = useCallback(() => {
    batcher.resume()
    setBatcherStatus(batcher.getStatus())
  }, [batcher])

  // Clear the batcher queue
  const clearBatcherQueue = useCallback(() => {
    batcher.clear()
    setBatcherStatus(batcher.getStatus())
  }, [batcher])

  return {
    executeBatched,
    executeBatchedQuery,
    pauseBatcher,
    resumeBatcher,
    clearBatcherQueue,
    batcherStatus,
  }
}
