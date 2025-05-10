"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { getSupabaseClient } from "@/utils/supabase-client"

// Define types for our batching system
type BatcherStatus = "idle" | "pending" | "success" | "error" | "rate-limited" | "network-error"

type BatchPriority = "high" | "medium" | "low"

type BatchOptions = {
  priority?: BatchPriority
  category?: string
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  bypassBatching?: boolean
  retryOnNetworkError?: boolean
  maxRetries?: number
}

interface BatchItem {
  id: string
  fn: () => Promise<any>
  resolve: (value: any) => void
  reject: (reason?: any) => void
  priority: BatchPriority
  category: string
  timestamp: number
  retryCount?: number
  retryOnNetworkError?: boolean
  maxRetries?: number
}

// Create a singleton batch manager to maintain state across components
class BatchManager {
  private static instance: BatchManager | null = null
  private queue: BatchItem[] = []
  private timer: NodeJS.Timeout | null = null
  private processing = false
  private rateLimited = false
  private rateLimitTimer: NodeJS.Timeout | null = null
  private listeners: { [key: string]: ((status: BatcherStatus) => void)[] } = {}
  private batchInterval = 100 // ms
  private maxBatchSize = 5
  private networkError = false
  private networkCheckTimer: NodeJS.Timeout | null = null
  private authOperationInProgress = false
  private networkCheckInProgress = false
  private lastSuccessfulNetworkCheck = 0
  private networkCheckRetryCount = 0
  private maxNetworkCheckRetries = 3
  private networkCheckBackoff = 5000 // Start with 5 seconds

  private constructor() {
    // Private constructor to enforce singleton
    this.checkNetworkStatus()

    // Add event listeners for online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline)
      window.addEventListener("offline", this.handleOffline)
    }
  }

  public static getInstance(): BatchManager {
    if (!BatchManager.instance) {
      BatchManager.instance = new BatchManager()
    }
    return BatchManager.instance
  }

  private handleOnline = () => {
    console.log("Browser reports online status")
    // Don't immediately set networkError to false
    // Instead, verify with an actual network check
    this.networkCheckRetryCount = 0
    this.networkCheckBackoff = 5000
    this.performNetworkCheck()
  }

  private handleOffline = () => {
    console.log("Browser reports offline status")
    this.networkError = true
    this.notifyListeners("network-error")
  }

  // Check network status periodically
  private checkNetworkStatus(): void {
    // Check immediately
    this.performNetworkCheck()

    // Then check every 30 seconds
    this.networkCheckTimer = setInterval(() => {
      // Only perform check if we haven't done one recently (within 10 seconds)
      const now = Date.now()
      if (now - this.lastSuccessfulNetworkCheck > 10000) {
        this.performNetworkCheck()
      }
    }, 30000)
  }

  private async performNetworkCheck(): Promise<void> {
    // Prevent multiple simultaneous checks
    if (this.networkCheckInProgress) return

    this.networkCheckInProgress = true

    try {
      // Simple check to see if we can reach the Supabase URL
      if (typeof window !== "undefined") {
        const online = navigator.onLine
        if (!online) {
          this.networkError = true
          this.notifyListeners("network-error")
          this.networkCheckInProgress = false
          return
        }

        // If we're online according to the browser, do a more thorough check
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        try {
          // Try multiple endpoints to be more resilient
          const endpoints = [
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            "https://www.google.com",
            "https://www.cloudflare.com",
          ]

          // Try each endpoint until one succeeds
          for (const endpoint of endpoints) {
            try {
              const response = await fetch(endpoint, {
                method: "HEAD",
                signal: controller.signal,
                mode: "no-cors", // Avoid CORS issues
                cache: "no-store", // Avoid caching
                credentials: "omit", // Don't send cookies
              })

              // If we get here, the network is working
              clearTimeout(timeoutId)
              this.networkError = false
              this.lastSuccessfulNetworkCheck = Date.now()
              this.networkCheckRetryCount = 0
              this.networkCheckBackoff = 5000

              // If we were previously in error state, notify listeners we're back online
              this.notifyListeners("idle")

              // Resume processing if we have items in the queue
              if (this.queue.length > 0 && !this.processing && !this.rateLimited) {
                this.scheduleBatch()
              }

              this.networkCheckInProgress = false
              return
            } catch (endpointError) {
              // Try the next endpoint
              console.warn(`Network check failed for ${endpoint}:`, endpointError)
            }
          }

          // If we get here, all endpoints failed
          throw new Error("All network check endpoints failed")
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      }
    } catch (error) {
      console.warn("Network check failed:", error)
      this.networkError = true
      this.notifyListeners("network-error")

      // Implement exponential backoff for retries
      if (this.networkCheckRetryCount < this.maxNetworkCheckRetries) {
        this.networkCheckRetryCount++
        this.networkCheckBackoff *= 2 // Exponential backoff

        console.log(
          `Scheduling network check retry in ${this.networkCheckBackoff}ms (attempt ${this.networkCheckRetryCount})`,
        )

        setTimeout(() => {
          this.performNetworkCheck()
        }, this.networkCheckBackoff)
      }
    } finally {
      this.networkCheckInProgress = false
    }
  }

  // Set auth operation status
  public setAuthOperationStatus(inProgress: boolean): void {
    this.authOperationInProgress = inProgress

    // If auth operation completed and we have items in queue, resume processing
    if (!inProgress && this.queue.length > 0 && !this.processing && !this.rateLimited && !this.networkError) {
      this.scheduleBatch()
    }
  }

  public addToBatch(item: Omit<BatchItem, "id" | "timestamp">): string {
    // If we have a network error and not retrying on network error, reject immediately
    if (this.networkError && !item.retryOnNetworkError) {
      setTimeout(() => {
        item.reject(new Error("Network error: Unable to connect to the server"))
      }, 0)
      return "network-error"
    }

    const id = Math.random().toString(36).substring(2, 9)

    this.queue.push({
      ...item,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    })

    this.notifyListeners("pending")
    this.scheduleBatch()

    return id
  }

  public getStatus(): {
    queueLength: number
    processing: boolean
    rateLimited: boolean
    networkError: boolean
    authOperationInProgress: boolean
  } {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      rateLimited: this.rateLimited,
      networkError: this.networkError,
      authOperationInProgress: this.authOperationInProgress,
    }
  }

  public addListener(id: string, callback: (status: BatcherStatus) => void): void {
    if (!this.listeners[id]) {
      this.listeners[id] = []
    }
    this.listeners[id].push(callback)
  }

  public removeListener(id: string): void {
    delete this.listeners[id]
  }

  private notifyListeners(status: BatcherStatus): void {
    Object.values(this.listeners).forEach((callbacks) => {
      callbacks.forEach((callback) => {
        try {
          callback(status)
        } catch (error) {
          console.error("Error in batch manager listener:", error)
        }
      })
    })
  }

  private scheduleBatch(): void {
    if (this.timer || this.processing || this.rateLimited || this.networkError || this.authOperationInProgress) return

    this.timer = setTimeout(() => {
      this.processBatch()
    }, this.batchInterval)
  }

  private async processBatch(): void {
    if (
      this.processing ||
      this.rateLimited ||
      this.queue.length === 0 ||
      this.networkError ||
      this.authOperationInProgress
    ) {
      this.timer = null
      return
    }

    this.processing = true
    this.timer = null

    // Sort queue by priority
    this.queue.sort((a, b) => {
      const priorityOrder: { [key in BatchPriority]: number } = {
        high: 0,
        medium: 1,
        low: 2,
      }

      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }

      // If same priority, sort by timestamp (oldest first)
      return a.timestamp - b.timestamp
    })

    // Take a batch of requests
    const currentBatch = this.queue.splice(0, this.maxBatchSize)

    try {
      // Process each request individually to handle errors better
      const results = await Promise.allSettled(currentBatch.map((item) => item.fn()))

      // Handle results
      results.forEach((result, index) => {
        const item = currentBatch[index]

        if (result.status === "fulfilled") {
          item.resolve(result.value)
        } else {
          // Check if this is a rate limit error
          const error = result.reason
          if (this.isRateLimitError(error)) {
            this.handleRateLimit()
          } else if (this.isNetworkError(error)) {
            // Handle network error
            this.networkError = true
            this.notifyListeners("network-error")

            // If we should retry on network error
            if (item.retryOnNetworkError && (item.retryCount || 0) < (item.maxRetries || 3)) {
              // Put back in queue with incremented retry count
              this.queue.push({
                ...item,
                retryCount: (item.retryCount || 0) + 1,
              })

              // Schedule a network check
              setTimeout(() => this.performNetworkCheck(), 2000)
            } else {
              item.reject(error)
            }
          } else if (this.isDatabaseError(error)) {
            // Handle database errors specially
            console.error("Database error in batch processing:", error)
            item.reject(error)
          } else {
            item.reject(error)
          }
        }
      })

      this.notifyListeners("success")
    } catch (error) {
      // This should rarely happen since we're using Promise.allSettled
      currentBatch.forEach((item) => item.reject(error))

      // Check if this is a rate limit error
      if (this.isRateLimitError(error)) {
        this.handleRateLimit()
      } else if (this.isNetworkError(error)) {
        this.networkError = true
        this.notifyListeners("network-error")

        // Schedule a network check
        setTimeout(() => this.performNetworkCheck(), 2000)
      } else if (this.isDatabaseError(error)) {
        // Handle database errors specially
        console.error("Database error in batch processing:", error)
        this.notifyListeners("error")
      } else {
        this.notifyListeners("error")
      }
    } finally {
      this.processing = false

      // If we still have items in the queue and we're not rate limited, process the next batch
      if (this.queue.length > 0 && !this.rateLimited && !this.networkError && !this.authOperationInProgress) {
        this.scheduleBatch()
      }
    }
  }

  private isRateLimitError(error: any): boolean {
    if (!error) return false

    // Check for common rate limit indicators
    if (error.status === 429) return true
    if (
      error.message &&
      (error.message.includes("429") ||
        error.message.includes("Too Many Requests") ||
        error.message.includes("rate limit"))
    )
      return true

    return false
  }

  private isNetworkError(error: any): boolean {
    if (!error) return false

    // Check for network error indicators
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) return true
    if (error instanceof DOMException && error.name === "AbortError") return true
    if (
      error.message &&
      (error.message.includes("network") ||
        error.message.includes("Network") ||
        error.message.includes("connection") ||
        error.message.includes("Connection") ||
        error.message.includes("offline") ||
        error.message.includes("Offline") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("timeout") ||
        error.message.includes("Timeout"))
    )
      return true

    return false
  }

  private isDatabaseError(error: any): boolean {
    if (!error) return false

    // Check for database error indicators
    if (
      error.message &&
      (error.message.includes("database") ||
        error.message.includes("Database") ||
        error.message.includes("db error") ||
        error.message.includes("DB error") ||
        error.message.includes("SQL") ||
        error.message.includes("constraint") ||
        error.message.includes("duplicate key") ||
        error.message.includes("foreign key"))
    )
      return true

    // Check for Supabase database error codes
    if (
      error.code &&
      (error.code.startsWith("22") || // Data exception
        error.code.startsWith("23") || // Integrity constraint violation
        error.code.startsWith("42") || // Syntax error or access rule violation
        error.code === "PGRST") // PostgREST error
    )
      return true

    return false
  }

  private handleRateLimit(): void {
    if (this.rateLimited) return

    this.rateLimited = true
    this.notifyListeners("rate-limited")

    // Reset after 60 seconds (typical rate limit window)
    this.rateLimitTimer = setTimeout(() => {
      this.rateLimited = false
      this.notifyListeners("idle")

      // Resume processing if we have items in the queue
      if (this.queue.length > 0 && !this.networkError && !this.authOperationInProgress) {
        this.scheduleBatch()
      }
    }, 60 * 1000)
  }

  public clearQueue(): void {
    const queueItems = [...this.queue]
    this.queue = []

    // Reject all pending requests
    queueItems.forEach((item) => {
      item.reject(new Error("Request was cleared from the queue"))
    })

    this.notifyListeners("idle")
  }

  // Force a network check
  public checkNetwork(): Promise<boolean> {
    return new Promise((resolve) => {
      const previousState = this.networkError

      // Perform network check
      this.performNetworkCheck()
        .then(() => {
          // Wait a bit to ensure the check completes
          setTimeout(() => {
            resolve(!this.networkError)
          }, 1000)
        })
        .catch(() => {
          resolve(false)
        })
    })
  }

  // Clean up resources
  public dispose(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline)
      window.removeEventListener("offline", this.handleOffline)
    }

    if (this.networkCheckTimer) {
      clearInterval(this.networkCheckTimer)
    }
    if (this.rateLimitTimer) {
      clearTimeout(this.rateLimitTimer)
    }
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.queue = []
    this.listeners = {}
  }
}

// Define the hook function
function useBatchedSupabaseHook() {
  const { user } = useAuth()
  const [status, setStatus] = useState<BatcherStatus>("idle")
  const [batcherStatus, setBatcherStatus] = useState({
    queueLength: 0,
    processing: false,
    rateLimited: false,
    networkError: false,
    authOperationInProgress: false,
  })
  const listenerIdRef = useRef<string>(`listener_${Math.random().toString(36).substring(2, 9)}`)

  // Get the singleton batch manager
  const batchManager = BatchManager.getInstance()

  // Update status when batch manager status changes
  useEffect(() => {
    const listenerId = listenerIdRef.current

    // Add listener to batch manager
    batchManager.addListener(listenerId, (newStatus) => {
      setStatus(newStatus)
      setBatcherStatus(batchManager.getStatus())
    })

    // Initial status
    setBatcherStatus(batchManager.getStatus())

    // Clean up listener on unmount
    return () => {
      batchManager.removeListener(listenerId)
    }
  }, [])

  // Reset when user changes
  useEffect(() => {
    if (!user) {
      setStatus("idle")
    }
  }, [user])

  // Execute a function through the batch manager
  const executeBatched = useCallback(<T,>(fn: () => Promise<T>, options: BatchOptions = {}): Promise<T> => {
    const {
      priority = "medium",
      category = "default",
      onSuccess,
      onError,
      bypassBatching = false,
      retryOnNetworkError = false,
      maxRetries = 3,
    } = options

    // For auth operations or when bypassing batching, execute directly
    if (bypassBatching || category === "auth") {
      // Signal that an auth operation is in progress
      if (category === "auth") {
        batchManager.setAuthOperationStatus(true)
      }

      return fn()
        .then((result) => {
          if (onSuccess) onSuccess(result)
          // Reset auth operation status if needed
          if (category === "auth") {
            batchManager.setAuthOperationStatus(false)
          }
          return result
        })
        .catch((error) => {
          if (onError) onError(error)
          // Reset auth operation status if needed
          if (category === "auth") {
            batchManager.setAuthOperationStatus(false)
          }
          throw error
        })
    }

    // Otherwise, use the batch manager
    return new Promise<T>((resolve, reject) => {
      batchManager.addToBatch({
        fn: async () => {
          try {
            const result = await fn()
            if (onSuccess) onSuccess(result)
            return result
          } catch (error) {
            if (onError) onError(error)
            throw error
          }
        },
        resolve,
        reject,
        priority,
        category,
        retryOnNetworkError,
        maxRetries,
      })
    })
  }, [])

  // Execute a Supabase query through the batch manager
  const executeBatchedQuery = useCallback(
    <T,>(
      queryFn: (supabase: ReturnType<typeof getSupabaseClient>) => Promise<{ data: T | null; error: any }>,
      options: BatchOptions = {},
    ): Promise<T> => {
      return executeBatched(async () => {
        try {
          const supabase = getSupabaseClient()
          const { data, error } = await queryFn(supabase)

          if (error) {
            console.error("Supabase query error:", error)
            throw error
          }

          if (data === null) {
            throw new Error("No data returned from query")
          }

          return data as T
        } catch (error) {
          console.error("Error in executeBatchedQuery:", error)
          throw error
        }
      }, options)
    },
    [executeBatched],
  )

  const clearQueue = useCallback(() => batchManager.clearQueue(), [])

  // Set auth operation status
  const setAuthOperationStatus = useCallback((inProgress: boolean) => {
    batchManager.setAuthOperationStatus(inProgress)
  }, [])

  // Force a network check
  const checkNetwork = useCallback(async (): Promise<boolean> => {
    return batchManager.checkNetwork()
  }, [])

  return {
    executeBatched,
    executeBatchedQuery,
    status,
    batcherStatus,
    clearQueue,
    setAuthOperationStatus,
    checkNetwork,
  }
}

// IMPORTANT: Export both as a named export AND as default
export function useBatchedSupabase() {
  return useBatchedSupabaseHook()
}

export default useBatchedSupabase
