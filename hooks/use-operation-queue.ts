"use client"

import { useCallback } from "react"
import { getOperationQueue } from "@/lib/operation-queue"

/**
 * Hook for using the operation queue
 */
export function useOperationQueue() {
  const enqueue = useCallback(<T,>(operation: () => Promise<T>, id?: string): Promise<T> => {
    const queue = getOperationQueue()
    return queue.enqueue(operation, id)
  }, [])

  const getQueueStats = useCallback(() => {
    const queue = getOperationQueue()
    return {
      length: queue.length,
      active: queue.active,
    }
  }, [])

  const clearQueue = useCallback(() => {
    const queue = getOperationQueue()
    queue.clear()
  }, [])

  return {
    enqueue,
    getQueueStats,
    clearQueue,
  }
}
