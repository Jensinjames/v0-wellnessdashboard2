/**
 * Request Batcher
 *
 * This utility batches multiple API requests together to reduce the number of network calls
 * and minimize the risk of hitting rate limits.
 */

type BatchableRequest = {
  id: string
  execute: () => Promise<any>
  resolve: (value: any) => void
  reject: (reason: any) => void
  timestamp: number
  priority: "high" | "medium" | "low"
  category: string
}

type BatcherOptions = {
  maxBatchSize?: number
  batchInterval?: number
  maxConcurrentBatches?: number
  retryCount?: number
  retryDelay?: number
  priorityOrder?: Array<"high" | "medium" | "low">
}

class RequestBatcher {
  private queue: BatchableRequest[] = []
  private isProcessing = false
  private batchTimer: NodeJS.Timeout | null = null
  private activeBatches = 0
  private options: Required<BatcherOptions>
  private paused = false
  private rateLimited = false
  private rateLimitResetTimer: NodeJS.Timeout | null = null
  private listeners: { [event: string]: Array<(...args: any[]) => void> } = {}

  constructor(options?: BatcherOptions) {
    this.options = {
      maxBatchSize: options?.maxBatchSize ?? 5,
      batchInterval: options?.batchInterval ?? 100,
      maxConcurrentBatches: options?.maxConcurrentBatches ?? 2,
      retryCount: options?.retryCount ?? 3,
      retryDelay: options?.retryDelay ?? 1000,
      priorityOrder: options?.priorityOrder ?? ["high", "medium", "low"],
    }
  }

  /**
   * Add a request to the batch queue
   */
  public add<T>(
    executeFunction: () => Promise<T>,
    options: {
      priority?: "high" | "medium" | "low"
      category?: string
    } = {},
  ): Promise<T> {
    const id = Math.random().toString(36).substring(2, 9)
    const timestamp = Date.now()
    const priority = options.priority || "medium"
    const category = options.category || "default"

    return new Promise<T>((resolve, reject) => {
      const request: BatchableRequest = {
        id,
        execute: executeFunction,
        resolve,
        reject,
        timestamp,
        priority,
        category,
      }

      this.queue.push(request)
      this.emit("queued", { id, timestamp, priority, category })

      // Start processing if not already in progress
      this.scheduleProcessing()
    })
  }

  /**
   * Schedule processing of the queue
   */
  private scheduleProcessing(): void {
    if (this.batchTimer !== null) {
      return
    }

    this.batchTimer = setTimeout(() => {
      this.batchTimer = null
      this.processQueue()
    }, this.options.batchInterval)
  }

  /**
   * Process the queue of requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.paused || this.rateLimited || this.queue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      // Process batches while we have items and aren't at max concurrent batches
      while (
        this.queue.length > 0 &&
        this.activeBatches < this.options.maxConcurrentBatches &&
        !this.paused &&
        !this.rateLimited
      ) {
        // Sort queue by priority and timestamp
        this.sortQueue()

        // Take a batch of requests
        const batch = this.queue.splice(0, this.options.maxBatchSize)

        if (batch.length === 0) break

        this.activeBatches++
        this.emit("batchStart", { size: batch.length, timestamp: Date.now() })

        // Process the batch asynchronously
        this.processBatch(batch).finally(() => {
          this.activeBatches--

          // If we have more items and aren't already processing, schedule more processing
          if (this.queue.length > 0 && !this.batchTimer) {
            this.scheduleProcessing()
          }
        })
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a batch of requests
   */
  private async processBatch(batch: BatchableRequest[]): Promise<void> {
    const batchStartTime = Date.now()
    const results: { [id: string]: { success: boolean; value?: any; error?: any } } = {}

    // Execute all requests in parallel
    await Promise.allSettled(
      batch.map(async (request) => {
        try {
          const result = await this.executeWithRetry(request)
          results[request.id] = { success: true, value: result }
        } catch (error) {
          results[request.id] = { success: false, error }

          // Check if this is a rate limit error
          if (this.isRateLimitError(error)) {
            this.handleRateLimit()
          }
        }
      }),
    )

    // Resolve or reject each request
    batch.forEach((request) => {
      const result = results[request.id]
      if (result) {
        if (result.success) {
          request.resolve(result.value)
        } else {
          request.reject(result.error)
        }
      } else {
        request.reject(new Error("Request was not processed"))
      }
    })

    const batchEndTime = Date.now()
    this.emit("batchComplete", {
      size: batch.length,
      duration: batchEndTime - batchStartTime,
      timestamp: batchEndTime,
    })
  }

  /**
   * Execute a request with retry logic
   */
  private async executeWithRetry(request: BatchableRequest, attempt = 0): Promise<any> {
    try {
      return await request.execute()
    } catch (error) {
      // If we've reached max retries or this isn't a retryable error, throw
      if (attempt >= this.options.retryCount || !this.isRetryableError(error)) {
        throw error
      }

      // Calculate backoff delay with exponential backoff
      const delay = this.options.retryDelay * Math.pow(2, attempt)

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Retry the request
      return this.executeWithRetry(request, attempt + 1)
    }
  }

  /**
   * Sort the queue by priority and timestamp
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // First sort by priority
      const priorityA = this.options.priorityOrder.indexOf(a.priority)
      const priorityB = this.options.priorityOrder.indexOf(b.priority)

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      // Then sort by timestamp (oldest first)
      return a.timestamp - b.timestamp
    })
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors are retryable
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      return true
    }

    // Timeout errors are retryable
    if (error.message?.includes("timeout") || error.message?.includes("Timeout")) {
      return true
    }

    // 5xx errors are retryable
    if (error.status >= 500 && error.status < 600) {
      return true
    }

    // 429 Too Many Requests is retryable but handled separately
    if (error.status === 429 || error.message?.includes("429") || error.message?.includes("Too Many R")) {
      return true
    }

    return false
  }

  /**
   * Check if an error is a rate limit error
   */
  private isRateLimitError(error: any): boolean {
    // Check for 429 status code
    if (error.status === 429) {
      return true
    }

    // Check for rate limit error messages
    if (
      error.message?.includes("429") ||
      error.message?.includes("Too Many R") ||
      error.message?.includes("rate limit") ||
      error.message?.includes("Rate Limit")
    ) {
      return true
    }

    // Check for Supabase specific rate limit errors
    if (error.code === "PGRST429") {
      return true
    }

    return false
  }

  /**
   * Handle rate limiting by pausing the batcher
   */
  private handleRateLimit(): void {
    if (this.rateLimited) return

    this.rateLimited = true
    this.emit("rateLimited", { timestamp: Date.now() })

    // Reset after 60 seconds (typical rate limit window)
    if (this.rateLimitResetTimer) {
      clearTimeout(this.rateLimitResetTimer)
    }

    this.rateLimitResetTimer = setTimeout(() => {
      this.rateLimited = false
      this.emit("rateLimitReset", { timestamp: Date.now() })

      // Resume processing
      if (this.queue.length > 0) {
        this.scheduleProcessing()
      }
    }, 60 * 1000)
  }

  /**
   * Pause the batcher
   */
  public pause(): void {
    this.paused = true
    this.emit("paused", { timestamp: Date.now() })
  }

  /**
   * Resume the batcher
   */
  public resume(): void {
    this.paused = false
    this.emit("resumed", { timestamp: Date.now() })

    if (this.queue.length > 0) {
      this.scheduleProcessing()
    }
  }

  /**
   * Clear all pending requests
   */
  public clear(): void {
    const queueLength = this.queue.length

    // Reject all pending requests
    this.queue.forEach((request) => {
      request.reject(new Error("Request was cleared from the queue"))
    })

    this.queue = []
    this.emit("cleared", { count: queueLength, timestamp: Date.now() })
  }

  /**
   * Get the current queue length
   */
  public getQueueLength(): number {
    return this.queue.length
  }

  /**
   * Get the current status of the batcher
   */
  public getStatus(): {
    queueLength: number
    activeBatches: number
    paused: boolean
    rateLimited: boolean
  } {
    return {
      queueLength: this.queue.length,
      activeBatches: this.activeBatches,
      paused: this.paused,
      rateLimited: this.rateLimited,
    }
  }

  /**
   * Add an event listener
   */
  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  /**
   * Remove an event listener
   */
  public off(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners[event]) return

    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
  }

  /**
   * Emit an event
   */
  private emit(event: string, data: any): void {
    if (!this.listeners[event]) return

    this.listeners[event].forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
  }
}

// Create a singleton instance
let batcherInstance: RequestBatcher | null = null

/**
 * Get the global request batcher instance
 */
export function getRequestBatcher(options?: BatcherOptions): RequestBatcher {
  if (!batcherInstance) {
    batcherInstance = new RequestBatcher(options)
  }
  return batcherInstance
}

/**
 * Reset the batcher instance (mainly for testing)
 */
export function resetRequestBatcher(): void {
  batcherInstance = null
}
