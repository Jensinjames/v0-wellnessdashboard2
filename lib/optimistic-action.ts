"use client"

import { createLogger } from "@/utils/logger"

const logger = createLogger("OptimisticAction")

type OptimisticActionOptions<T, P> = {
  action: (params: P) => Promise<{ success: boolean; data?: T; error?: any; fieldErrors?: Record<string, string> }>
  table: string
  operation: "insert" | "update" | "delete" | "upsert"
  getOptimisticData: (params: P) => T
  optimisticId?: string
  originalData?: T
  onSuccess?: (result: { success: boolean; data?: T; error?: any }, optimisticId: string) => void
  onError?: (error: any, optimisticId: string) => void
  onSettled?: (optimisticId: string) => void
}

export async function executeOptimisticAction<T, P>(
  options: OptimisticActionOptions<T, P>,
): Promise<{
  success: boolean
  data?: T
  error?: any
  optimisticId: string
}> {
  const { action, table, operation, getOptimisticData, onSuccess, onError, onSettled, optimisticId, originalData } =
    options

  const id = optimisticId || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  try {
    const optimisticData = getOptimisticData(null as any)

    // Execute the action
    const result = await action(null as any)

    if (result.success) {
      // Call success callback if provided
      onSuccess?.(result, id)
    } else {
      // Call error callback if provided
      onError?.(result.error, id)
    }

    return { ...result, optimisticId: id }
  } catch (error: any) {
    logger.error(`Error executing optimistic action for ${table}:${operation}`, error)
    onError?.(error, id)
    return { success: false, error, optimisticId: id }
  } finally {
    onSettled?.(id)
  }
}

export type { OptimisticActionOptions }
