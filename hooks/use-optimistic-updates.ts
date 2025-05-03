"use client"

import { useState, useCallback, useRef } from "react"
import { toast } from "@/hooks/use-toast"

// Define the operation types
export type OptimisticOperation = {
  id: string
  type: "create" | "update" | "delete"
  entityType: "category" | "entry" | "goal" | "setting"
  data: any
  timestamp: number
  status: "pending" | "success" | "error"
  rollbackData?: any
}

// Define the hook return type
interface UseOptimisticUpdatesReturn<T> {
  // Track pending operations
  pendingOperations: OptimisticOperation[]
  isPending: (id: string) => boolean

  // Optimistic operation handlers
  optimisticCreate: (data: Omit<T, "id">, createFn: (data: Omit<T, "id">) => Promise<any>) => Promise<T | null>
  optimisticUpdate: (
    id: string,
    updates: Partial<T>,
    updateFn: (id: string, updates: Partial<T>) => Promise<any>,
  ) => Promise<T | null>
  optimisticDelete: (id: string, deleteFn: (id: string) => Promise<any>) => Promise<boolean>

  // Batch operations
  optimisticBatch: <R>(
    operations: Array<{
      type: "create" | "update" | "delete"
      id?: string
      data?: any
    }>,
    batchFn: () => Promise<R>,
  ) => Promise<R | null>

  // Utilities
  clearPendingOperations: () => void
}

/**
 * Hook for handling optimistic UI updates
 */
export function useOptimisticUpdates<T extends { id: string }>(): UseOptimisticUpdatesReturn<T> {
  // State to track pending operations
  const [pendingOperations, setPendingOperations] = useState<OptimisticOperation[]>([])

  // Use a ref to track the latest state for async operations
  const operationsRef = useRef<OptimisticOperation[]>([])
  operationsRef.current = pendingOperations

  // Check if an operation is pending
  const isPending = useCallback(
    (id: string) => {
      return pendingOperations.some((op) => op.id === id && op.status === "pending")
    },
    [pendingOperations],
  )

  // Generate a unique operation ID
  const generateOperationId = useCallback(() => {
    return `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }, [])

  // Add a pending operation
  const addPendingOperation = useCallback(
    (operation: Omit<OptimisticOperation, "id" | "timestamp" | "status">) => {
      const newOperation: OptimisticOperation = {
        ...operation,
        id: generateOperationId(),
        timestamp: Date.now(),
        status: "pending",
      }

      setPendingOperations((prev) => [...prev, newOperation])
      return newOperation.id
    },
    [generateOperationId, setPendingOperations],
  )

  // Update operation status
  const updateOperationStatus = useCallback(
    (operationId: string, status: "success" | "error") => {
      setPendingOperations((prev) => prev.map((op) => (op.id === operationId ? { ...op, status } : op)))
    },
    [setPendingOperations],
  )

  // Remove completed operations after a delay
  const cleanupOperations = useCallback(() => {
    const now = Date.now()
    setPendingOperations((prev) => prev.filter((op) => op.status === "pending" || now - op.timestamp < 5000))
  }, [setPendingOperations])

  // Clear all pending operations
  const clearPendingOperations = useCallback(() => {
    setPendingOperations([])
  }, [setPendingOperations])

  // Optimistic create operation
  const optimisticCreate = useCallback(
    async (data: Omit<T, "id">, createFn: (data: Omit<T, "id">) => Promise<any>): Promise<T | null> => {
      // Generate a temporary ID for the new entity
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // Create the temporary entity with the temp ID
      const tempEntity = { ...data, id: tempId } as T

      // Add to pending operations
      const operationId = addPendingOperation({
        type: "create",
        entityType: "entry", // Default, should be overridden by the caller context
        data: tempEntity,
        rollbackData: null, // No rollback for create
      })

      try {
        // Perform the actual create operation
        const result = await createFn(data)

        // Update operation status
        updateOperationStatus(operationId, "success")

        // Clean up completed operations after a delay
        setTimeout(cleanupOperations, 5000)

        return result.data || result
      } catch (error) {
        // Update operation status
        updateOperationStatus(operationId, "error")

        // Show error toast
        toast({
          title: "Create Failed",
          description: error instanceof Error ? error.message : "Failed to create. Please try again.",
          variant: "destructive",
        })

        // Clean up failed operations after a delay
        setTimeout(cleanupOperations, 5000)

        return null
      }
    },
    [addPendingOperation, updateOperationStatus, cleanupOperations, toast],
  )

  // Optimistic update operation
  const optimisticUpdate = useCallback(
    async (
      id: string,
      updates: Partial<T>,
      updateFn: (id: string, updates: Partial<T>) => Promise<any>,
    ): Promise<T | null> => {
      // Add to pending operations
      const operationId = addPendingOperation({
        type: "update",
        entityType: "entry", // Default, should be overridden by the caller context
        data: { id, ...updates },
        rollbackData: { id }, // Minimal rollback data, should be enhanced by the caller
      })

      try {
        // Perform the actual update operation
        const result = await updateFn(id, updates)

        // Update operation status
        updateOperationStatus(operationId, "success")

        // Clean up completed operations after a delay
        setTimeout(cleanupOperations, 5000)

        return result.data || result
      } catch (error) {
        // Update operation status
        updateOperationStatus(operationId, "error")

        // Show error toast
        toast({
          title: "Update Failed",
          description: error instanceof Error ? error.message : "Failed to update. Please try again.",
          variant: "destructive",
        })

        // Clean up failed operations after a delay
        setTimeout(cleanupOperations, 5000)

        return null
      }
    },
    [addPendingOperation, updateOperationStatus, cleanupOperations, toast],
  )

  // Optimistic delete operation
  const optimisticDelete = useCallback(
    async (id: string, deleteFn: (id: string) => Promise<any>): Promise<boolean> => {
      // Add to pending operations
      const operationId = addPendingOperation({
        type: "delete",
        entityType: "entry", // Default, should be overridden by the caller context
        data: { id },
        rollbackData: { id }, // Minimal rollback data, should be enhanced by the caller
      })

      try {
        // Perform the actual delete operation
        await deleteFn(id)

        // Update operation status
        updateOperationStatus(operationId, "success")

        // Clean up completed operations after a delay
        setTimeout(cleanupOperations, 5000)

        return true
      } catch (error) {
        // Update operation status
        updateOperationStatus(operationId, "error")

        // Show error toast
        toast({
          title: "Delete Failed",
          description: error instanceof Error ? error.message : "Failed to delete. Please try again.",
          variant: "destructive",
        })

        // Clean up failed operations after a delay
        setTimeout(cleanupOperations, 5000)

        return false
      }
    },
    [addPendingOperation, updateOperationStatus, cleanupOperations, toast],
  )

  // Batch operations
  const optimisticBatch = useCallback(async <R>(\
    operations: Array<{ 
      type: "create" | "update" | "delete";
  id?: string;
  data?: any
}
>,
    batchFn: () => Promise<R>
  ): Promise<R | null> =>
{
  // Add all operations to pending
  const operationIds = operations.map((op) => {
    return addPendingOperation({
      type: op.type,
      entityType: "entry", // Default, should be overridden by the caller context
      data: op.data || (op.id ? { id: op.id } : {}),
      rollbackData: op.id ? { id: op.id } : null,
    })
  })

  try {
    // Perform the actual batch operation
    const result = await batchFn()

    // Update all operation statuses
    operationIds.forEach((operationId) => updateOperationStatus(operationId, "success"))

    // Clean up completed operations after a delay
    setTimeout(cleanupOperations, 5000)

    return result
  } catch (error) {
    // Update all operation statuses
    operationIds.forEach((operationId) => updateOperationStatus(operationId, "error"))

    // Show error toast
    toast({
      title: "Batch Operation Failed",
      description: error instanceof Error ? error.message : "Failed to complete batch operation. Please try again.",
      variant: "destructive",
    })

    // Clean up failed operations after a delay
    setTimeout(cleanupOperations, 5000)

    return null
  }
}
, [addPendingOperation, updateOperationStatus, cleanupOperations, toast])

return {
    pendingOperations,
    isPending,
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,
    optimisticBatch,
    clearPendingOperations
  }
}
