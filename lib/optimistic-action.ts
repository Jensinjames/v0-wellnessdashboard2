/**
 * Optimistic Action Utility
 *
 * This utility helps integrate server actions with optimistic UI updates,
 * providing immediate feedback while ensuring data consistency.
 */
import { getOptimisticUpdates } from "@/lib/optimistic-updates"
import { createLogger } from "@/utils/logger"

const logger = createLogger("OptimisticAction")

type OptimisticActionOptions<T, R> = {
  // The action to execute (server action)
  action: (data: T) => Promise<R>

  // Data to pass to the action
  data: T

  // Table name for optimistic updates
  table: string

  // Function to create optimistic data before server response
  getOptimisticData: (data: T) => any

  // Function to process server response data (optional)
  processResponseData?: (response: R) => any

  // ID to use for the optimistic update (optional, generated if not provided)
  optimisticId?: string

  // Original data for updates (optional)
  originalData?: any

  // Operation type
  operation: "insert" | "update" | "delete" | "upsert"

  // Debug mode
  debug?: boolean

  // Callbacks
  onSuccess?: (result: R, optimisticId: string) => void
  onError?: (error: Error, optimisticId: string) => void
  onSettled?: (optimisticId: string) => void
}

/**
 * Execute a server action with optimistic UI updates
 */
export async function executeOptimisticAction<T, R>({
  action,
  data,
  table,
  getOptimisticData,
  processResponseData,
  optimisticId,
  originalData,
  operation,
  debug = false,
  onSuccess,
  onError,
  onSettled,
}: OptimisticActionOptions<T, R>) {
  const optimistic = getOptimisticUpdates()

  // Generate optimistic ID if not provided
  const id = optimisticId || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  // Get optimistic data
  const optimisticData = getOptimisticData(data)

  if (debug) {
    logger.debug(`Creating optimistic ${operation} for ${table}`, { id, data: optimisticData })
  }

  // Create optimistic update based on operation type
  let update
  switch (operation) {
    case "insert":
      update = optimistic.createOptimisticInsert(table, optimisticData)
      break
    case "update":
      update = optimistic.createOptimisticUpdate(table, id, optimisticData, originalData)
      break
    case "delete":
      update = optimistic.createOptimisticDelete(table, id, originalData)
      break
    case "upsert":
      // For upsert, we use update if we have original data, otherwise insert
      if (originalData) {
        update = optimistic.createOptimisticUpdate(table, id, optimisticData, originalData)
      } else {
        update = optimistic.createOptimisticInsert(table, optimisticData)
      }
      break
  }

  try {
    // Execute the server action
    const result = await action(data)

    // Process the response data if needed
    const processedData = processResponseData ? processResponseData(result) : result

    // Confirm the optimistic update with the real data
    optimistic.confirmUpdate(id, processedData)

    if (debug) {
      logger.debug(`Confirmed optimistic ${operation} for ${table}`, { id, result: processedData })
    }

    // Call success callback
    if (onSuccess) {
      onSuccess(result, id)
    }

    return { success: true, data: result, optimisticId: id }
  } catch (error) {
    // Mark the optimistic update as failed
    const err = error instanceof Error ? error : new Error(String(error))
    optimistic.failUpdate(id, err)

    if (debug) {
      logger.error(`Failed optimistic ${operation} for ${table}`, { id, error: err })
    }

    // Call error callback
    if (onError) {
      onError(err, id)
    }

    return { success: false, error: err, optimisticId: id }
  } finally {
    // Call settled callback
    if (onSettled) {
      onSettled(id)
    }
  }
}

export type { OptimisticActionOptions }
