/**
 * Optimistic Updates System
 * Updates UI immediately before server confirmation
 */
import { createLogger } from "@/utils/logger"
import { v4 as uuidv4 } from "uuid"

const logger = createLogger("OptimisticUpdates")

// Optimistic update type
type OptimisticUpdate<T> = {
  id: string
  table: string
  operation: "insert" | "update" | "delete" | "upsert"
  data: T
  originalData?: T
  timestamp: number
  status: "pending" | "confirmed" | "failed"
  error?: Error
}

// Configuration
type OptimisticConfig = {
  pendingTimeout: number // Time to wait before considering an update failed
  debug: boolean // Enable debug logging
}

// Default configuration
const DEFAULT_CONFIG: OptimisticConfig = {
  pendingTimeout: 30000, // 30 seconds
  debug: false,
}

// Listeners
type UpdateListener = (update: OptimisticUpdate<any>) => void

/**
 * Optimistic Updates Manager
 * Manages optimistic updates and their lifecycle
 */
export class OptimisticUpdates {
  private updates: Map<string, OptimisticUpdate<any>>
  private config: OptimisticConfig
  private listeners: UpdateListener[]
  private temporaryIdMap: Map<string, string> // Maps temporary IDs to real IDs

  constructor(config: Partial<OptimisticConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.updates = new Map()
    this.listeners = []
    this.temporaryIdMap = new Map()

    // Set up periodic cleanup
    if (typeof window !== "undefined") {
      setInterval(() => this.cleanup(), 60 * 1000) // Clean up every minute
    }
  }

  /**
   * Create an optimistic insert
   * @param table Table name
   * @param data Data to insert
   * @returns Optimistic update object with temporary ID
   */
  createOptimisticInsert<T extends Record<string, any>>(table: string, data: T): OptimisticUpdate<T> {
    // Generate a temporary ID
    const tempId = `temp_${uuidv4()}`

    // Create a copy of the data with the temporary ID
    const optimisticData = {
      ...data,
      id: tempId,
      __optimistic: true,
      __timestamp: Date.now(),
    }

    const update: OptimisticUpdate<T> = {
      id: tempId,
      table,
      operation: "insert",
      data: optimisticData,
      timestamp: Date.now(),
      status: "pending",
    }

    this.updates.set(tempId, update)
    this.notifyListeners(update)

    if (this.config.debug) {
      logger.debug(`Created optimistic insert for ${table}:`, { tempId, data })
    }

    return update
  }

  /**
   * Create an optimistic update
   * @param table Table name
   * @param id Record ID
   * @param data New data
   * @param originalData Original data (for rollback)
   * @returns Optimistic update object
   */
  createOptimisticUpdate<T extends Record<string, any>>(
    table: string,
    id: string,
    data: Partial<T>,
    originalData?: T,
  ): OptimisticUpdate<T> {
    // Check if this ID is a temporary ID that's been mapped
    const realId = this.temporaryIdMap.get(id) || id

    // Create optimistic data by merging original and new data
    const optimisticData = {
      ...(originalData || {}),
      ...data,
      id: realId,
      __optimistic: true,
      __timestamp: Date.now(),
    } as T

    const update: OptimisticUpdate<T> = {
      id: realId,
      table,
      operation: "update",
      data: optimisticData,
      originalData,
      timestamp: Date.now(),
      status: "pending",
    }

    this.updates.set(realId, update)
    this.notifyListeners(update)

    if (this.config.debug) {
      logger.debug(`Created optimistic update for ${table}:${realId}`, { data, originalData })
    }

    return update
  }

  /**
   * Create an optimistic delete
   * @param table Table name
   * @param id Record ID
   * @param originalData Original data (for rollback)
   * @returns Optimistic update object
   */
  createOptimisticDelete<T extends Record<string, any>>(
    table: string,
    id: string,
    originalData?: T,
  ): OptimisticUpdate<T> {
    // Check if this ID is a temporary ID that's been mapped
    const realId = this.temporaryIdMap.get(id) || id

    const update: OptimisticUpdate<T> = {
      id: realId,
      table,
      operation: "delete",
      data: { id: realId } as T,
      originalData,
      timestamp: Date.now(),
      status: "pending",
    }

    this.updates.set(realId, update)
    this.notifyListeners(update)

    if (this.config.debug) {
      logger.debug(`Created optimistic delete for ${table}:${realId}`, { originalData })
    }

    return update
  }

  /**
   * Confirm an optimistic update
   * @param tempId Temporary ID or update ID
   * @param realData Real data from server (with real ID)
   * @returns Updated optimistic update object
   */
  confirmUpdate<T extends Record<string, any>>(tempId: string, realData?: T): OptimisticUpdate<T> | null {
    const update = this.updates.get(tempId) as OptimisticUpdate<T> | undefined

    if (!update) {
      if (this.config.debug) {
        logger.warn(`Attempted to confirm unknown update: ${tempId}`)
      }
      return null
    }

    // Update the status
    update.status = "confirmed"

    // If we have real data with a different ID, update the temporary ID mapping
    if (realData && realData.id && realData.id !== tempId) {
      this.temporaryIdMap.set(tempId, realData.id)
      update.id = realData.id

      // Store the update under the real ID as well
      this.updates.set(realData.id, update)
    }

    // Update the data if provided
    if (realData) {
      update.data = {
        ...realData,
        __optimistic: false,
      }
    } else {
      // Just mark as not optimistic
      update.data = {
        ...update.data,
        __optimistic: false,
      }
    }

    this.notifyListeners(update)

    if (this.config.debug) {
      logger.debug(`Confirmed update ${tempId}`, { realData })
    }

    return update
  }

  /**
   * Mark an optimistic update as failed
   * @param id Update ID
   * @param error Error that occurred
   * @returns Updated optimistic update object
   */
  failUpdate<T>(id: string, error: Error): OptimisticUpdate<T> | null {
    const update = this.updates.get(id) as OptimisticUpdate<T> | undefined

    if (!update) {
      if (this.config.debug) {
        logger.warn(`Attempted to fail unknown update: ${id}`)
      }
      return null
    }

    // Update the status
    update.status = "failed"
    update.error = error

    this.notifyListeners(update)

    if (this.config.debug) {
      logger.debug(`Failed update ${id}`, { error })
    }

    return update
  }

  /**
   * Get all optimistic updates for a table
   * @param table Table name
   * @returns Array of optimistic updates
   */
  getUpdatesForTable<T>(table: string): OptimisticUpdate<T>[] {
    const updates: OptimisticUpdate<T>[] = []

    this.updates.forEach((update) => {
      if (update.table === table) {
        updates.push(update as OptimisticUpdate<T>)
      }
    })

    return updates
  }

  /**
   * Get an optimistic update by ID
   * @param id Update ID
   * @returns Optimistic update or null if not found
   */
  getUpdate<T>(id: string): OptimisticUpdate<T> | null {
    return (this.updates.get(id) as OptimisticUpdate<T>) || null
  }

  /**
   * Apply optimistic updates to a dataset
   * @param table Table name
   * @param data Original data array
   * @returns Data with optimistic updates applied
   */
  applyUpdates<T extends Record<string, any>>(table: string, data: T[]): T[] {
    const updates = this.getUpdatesForTable<T>(table)
    if (updates.length === 0) return data

    // Create a copy of the data
    let result = [...data]

    // Apply updates in order of timestamp
    updates
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach((update) => {
        if (update.status === "failed") {
          // Skip failed updates
          return
        }

        switch (update.operation) {
          case "insert":
            // Add the new item
            result.push(update.data)
            break

          case "update":
            // Update an existing item
            result = result.map((item) => {
              // Check both the real ID and any mapped temporary ID
              if (item.id === update.id || this.temporaryIdMap.get(item.id) === update.id) {
                return update.data
              }
              return item
            })
            break

          case "delete":
            // Remove the item
            result = result.filter((item) => {
              // Check both the real ID and any mapped temporary ID
              return item.id !== update.id && this.temporaryIdMap.get(item.id) !== update.id
            })
            break

          case "upsert":
            // Try to update, insert if not found
            const index = result.findIndex(
              (item) => item.id === update.id || this.temporaryIdMap.get(item.id) === update.id,
            )
            if (index >= 0) {
              result[index] = update.data
            } else {
              result.push(update.data)
            }
            break
        }
      })

    return result
  }

  /**
   * Add a listener for update events
   * @param listener Listener function
   */
  addListener(listener: UpdateListener): void {
    this.listeners.push(listener)
  }

  /**
   * Remove a listener
   * @param listener Listener function to remove
   */
  removeListener(listener: UpdateListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener)
  }

  /**
   * Clear all updates
   */
  clear(): void {
    this.updates.clear()
    this.temporaryIdMap.clear()
  }

  /**
   * Get statistics about optimistic updates
   */
  getStats() {
    const stats = {
      total: this.updates.size,
      pending: 0,
      confirmed: 0,
      failed: 0,
      byTable: {} as Record<string, { pending: number; confirmed: number; failed: number }>,
    }

    this.updates.forEach((update) => {
      // Update overall counts
      stats[update.status]++

      // Update table-specific counts
      if (!stats.byTable[update.table]) {
        stats.byTable[update.table] = { pending: 0, confirmed: 0, failed: 0 }
      }
      stats.byTable[update.table][update.status]++
    })

    return stats
  }

  /**
   * Notify all listeners of an update
   * @param update Update to notify about
   */
  private notifyListeners(update: OptimisticUpdate<any>): void {
    this.listeners.forEach((listener) => {
      try {
        listener(update)
      } catch (error) {
        logger.error("Error in optimistic update listener:", error)
      }
    })
  }

  /**
   * Clean up old updates
   */
  private cleanup(): void {
    const now = Date.now()
    let removedCount = 0

    this.updates.forEach((update, id) => {
      // Remove confirmed updates older than 5 minutes
      if (update.status === "confirmed" && now - update.timestamp > 5 * 60 * 1000) {
        this.updates.delete(id)
        removedCount++
      }

      // Remove failed updates older than 10 minutes
      if (update.status === "failed" && now - update.timestamp > 10 * 60 * 1000) {
        this.updates.delete(id)
        removedCount++
      }

      // Mark very old pending updates as failed
      if (update.status === "pending" && now - update.timestamp > this.config.pendingTimeout) {
        update.status = "failed"
        update.error = new Error("Update timed out")
        this.notifyListeners(update)
      }
    })

    if (this.config.debug && removedCount > 0) {
      logger.debug(`Cleaned up ${removedCount} old updates`)
    }
  }
}

// Create a singleton instance
let optimisticInstance: OptimisticUpdates | null = null

/**
 * Get the global optimistic updates instance
 */
export function getOptimisticUpdates(config?: Partial<OptimisticConfig>): OptimisticUpdates {
  if (!optimisticInstance) {
    optimisticInstance = new OptimisticUpdates(config)
  }
  return optimisticInstance
}

/**
 * Reset the optimistic updates manager (useful for testing)
 */
export function resetOptimisticUpdates(): void {
  if (optimisticInstance) {
    optimisticInstance.clear()
  }
  optimisticInstance = null
}
