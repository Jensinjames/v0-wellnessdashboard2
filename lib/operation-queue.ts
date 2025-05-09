/**
 * Operation Queue
 *
 * Manages a queue of operations to ensure they are executed in order
 * and prevents race conditions when multiple operations are in progress.
 */
import { createLogger } from "@/utils/logger"

const logger = createLogger("OperationQueue")

type QueuedOperation<T> = {
  id: string
  execute: () => Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
}

export class OperationQueue {
  private queue: QueuedOperation<any>[] = []
  private isProcessing = false
  private concurrency: number
  private activeOperations: Set<string> = new Set()
  private debug: boolean

  constructor(options: { concurrency?: number; debug?: boolean } = {}) {
    this.concurrency = options.concurrency || 1
    this.debug = options.debug || false
  }

  /**
   * Enqueue an operation to be executed
   * @param operation Function that returns a promise
   * @param id Optional ID for the operation (for deduplication)
   * @returns Promise that resolves when the operation completes
   */
  enqueue<T>(operation: () => Promise<T>, id?: string): Promise<T> {
    const operationId = id || `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // If this operation is already in the queue with the same ID, return a promise that
    // resolves when the existing operation completes
    if (id) {
      const existingOperation = this.queue.find((op) => op.id === id)
      if (existingOperation) {
        if (this.debug) {
          logger.debug(`Operation ${id} already in queue, returning existing promise`)
        }
        return new Promise<T>((resolve, reject) => {
          const originalResolve = existingOperation.resolve
          const originalReject = existingOperation.reject

          existingOperation.resolve = (value) => {
            originalResolve(value)
            resolve(value)
          }

          existingOperation.reject = (reason) => {
            originalReject(reason)
            reject(reason)
          }
        })
      }
    }

    return new Promise<T>((resolve, reject) => {
      // Create a new operation
      const queuedOperation: QueuedOperation<T> = {
        id: operationId,
        execute: operation,
        resolve,
        reject,
      }

      // Add to queue
      this.queue.push(queuedOperation)

      if (this.debug) {
        logger.debug(`Enqueued operation ${operationId}, queue length: ${this.queue.length}`)
      }

      // Start processing if not already
      this.processQueue()
    })
  }

  /**
   * Process the queue of operations
   */
  private async processQueue() {
    // If already processing or no operations in queue, return
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      // Process operations until queue is empty
      while (this.queue.length > 0 && this.activeOperations.size < this.concurrency) {
        // Get next operation
        const operation = this.queue.shift()

        if (!operation) continue

        // Mark as active
        this.activeOperations.add(operation.id)

        if (this.debug) {
          logger.debug(`Processing operation ${operation.id}, active: ${this.activeOperations.size}`)
        }

        // Execute operation
        operation
          .execute()
          .then((result) => {
            // Resolve the promise
            operation.resolve(result)

            if (this.debug) {
              logger.debug(`Operation ${operation.id} completed successfully`)
            }
          })
          .catch((error) => {
            // Reject the promise
            operation.reject(error)

            if (this.debug) {
              logger.error(`Operation ${operation.id} failed:`, error)
            }
          })
          .finally(() => {
            // Remove from active operations
            this.activeOperations.delete(operation.id)

            // Continue processing queue
            if (this.queue.length > 0) {
              this.processQueue()
            }
          })

        // If we have reached concurrency limit, wait for an operation to complete
        if (this.activeOperations.size >= this.concurrency) {
          break
        }
      }
    } finally {
      // If there are no active operations, mark as not processing
      if (this.activeOperations.size === 0) {
        this.isProcessing = false
      }
    }
  }

  /**
   * Get the current queue length
   */
  get length(): number {
    return this.queue.length
  }

  /**
   * Get the number of active operations
   */
  get active(): number {
    return this.activeOperations.size
  }

  /**
   * Clear the queue
   */
  clear() {
    // Reject all queued operations
    this.queue.forEach((operation) => {
      operation.reject(new Error("Operation cancelled"))
    })

    this.queue = []
  }
}

// Create a singleton instance
let queueInstance: OperationQueue | null = null

/**
 * Get the global operation queue
 */
export function getOperationQueue(options?: { concurrency?: number; debug?: boolean }): OperationQueue {
  if (!queueInstance) {
    queueInstance = new OperationQueue(options)
  }
  return queueInstance
}
