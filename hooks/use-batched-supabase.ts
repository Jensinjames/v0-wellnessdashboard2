"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getRequestBatcher } from "@/lib/request-batcher"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { useToast } from "@/hooks/use-toast"

/**
 * Options for batched operations
 */
type BatchOptions = {
  /** Priority level for the request */
  priority?: "high" | "medium" | "low"
  /** Category for grouping similar requests */
  category?: string
  /** Whether to retry on network errors */
  retryOnNetworkError?: boolean
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Custom timeout in milliseconds */
  timeout?: number
}

/**
 * Status information about the request batcher
 */
export interface BatcherStatus {
  /** Number of requests in the queue */
  queueLength: number
  /** Number of batches currently being processed */
  activeBatches: number
  /** Whether the batcher is paused */
  paused: boolean
  /** Whether the batcher is rate limited */
  rateLimited: boolean
  /** Whether there's a network error */
  networkError: boolean
  /** Whether the batcher is currently processing */
  processing: boolean
}

/**
 * Hook for using Supabase with request batching
 *
 * This hook provides utilities for batching Supabase requests to reduce
 * the number of network calls and prevent rate limiting.
 */
export function useBatchedSupabase() {
  // Track if the component is mounted
  const isMounted = useRef(true)
  const { toast } = useToast()
  const clientRef = useRef<SupabaseClient<Database> | null>(null)
  
  // Status state with all properties
  const [batcherStatus, setBatcherStatus] = useState<BatcherStatus>({
    queueLength: 0,
    activeBatches: 0,
    paused: false,
    rateLimited: false,
    networkError: false,
    processing: false
  })

  // Get the request batcher instance
  const batcher = getRequestBatcher()

  // Initialize Supabase client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = createClientComponentClient<Database>()
    }
    
    return () => {
      isMounted.current = false
    }
  }, [])

  // Update status when it changes
  useEffect(() => {
    if (!batcher) return
    
    const updateStatus = () => {
      if (!isMounted.current) return
      
      const status = batcher.getStatus()
      setBatcherStatus({
        ...status,
        networkError: status.networkError || false,
        processing: status.activeBatches > 0
      })
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
    batcher.on("networkError", updateStatus)
    batcher.on("networkRestored", updateStatus)

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
      batcher.off("networkError", updateStatus)
      batcher.off("networkRestored", updateStatus)
    }
  }, [batcher])

  /**
   * Execute a function in a batch
   * @param executeFunction Function to execute
   * @param options Batch options
   * @returns Promise with the result
   */
  const executeBatched = useCallback(
    <T>(executeFunction: () => Promise<T>, options: BatchOptions = {}): Promise<T> => {
      if (!batcher) {
        return executeFunction();
      }
      return batcher.add(executeFunction, options);
    },
    [batcher],
  )

  /**
   * Execute a Supabase query in a batch
   * @param queryFn Function that takes a Supabase client and returns a promise
   * @param options Batch options
   * @returns Promise with the query result
   */
  const executeBatchedQuery = useCallback(
    async <T>(
      queryFn: (supabase: SupabaseClient<Database>) => Promise<T>,
      options: BatchOptions = {},
    ): Promise<T> => {
      if (!batcher) {
        const supabase = clientRef.current || createClientComponentClient<Database>()
        return queryFn(supabase)
      }
      
      return batcher.add(
        async () => {
          const supabase = clientRef.current || createClientComponentClient<Database>()
          return queryFn(supabase)
        },
        { ...options, category: options.category || "database" },
      )
    },
    [batcher],
  )

  /**
   * Check network connectivity
   * @returns Promise that resolves to true if connected, false otherwise
   */
  const checkNetwork = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health-check', { 
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch (error) {
      return false
    }
  }, [])

  /**
   * Pause the batcher
   */
  const pauseBatcher = useCallback(() => {
    if (!batcher) return
    batcher.pause()
    if (isMounted.current) {
      setBatcherStatus(prev => ({ ...prev, paused: true }))
    }
  }, [batcher])

  /**
   * Resume the batcher
   */
  const resumeBatcher = useCallback(() => {
    if (!batcher) return
    batcher.resume()
    if (isMounted.current) {
      setBatcherStatus(prev => ({ ...prev, paused: false }))
    }
  }, [batcher])

  /**
   * Clear the batcher queue
   */
  const clearQueue = useCallback(() => {
    if (!batcher) return
    batcher.clear()
    if (isMounted.current) {
      setBatcherStatus(prev => ({ ...prev, queueLength: 0 }))
      toast({
        title: "Queue cleared",
        description: "All pending requests have been cleared.",
        duration: 3000
      })
    }
  }, [batcher, toast])

  return {
    executeBatched,
    executeBatchedQuery,
    pauseBatcher,
    resumeBatcher,
    clearQueue,
    checkNetwork,
    batcherStatus,
    status: "idle" // For backward compatibility
  }
}
