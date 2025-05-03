"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useOptimisticUpdates, type OptimisticOperation } from "@/hooks/use-optimistic-updates"

// Define the context type
interface OptimisticUpdatesContextType {
  pendingOperations: OptimisticOperation[]
  isPending: (id: string) => boolean
  optimisticCreate: <T extends { id: string }>(
    entityType: string,
    data: Omit<T, "id">,
    createFn: (data: Omit<T, "id">) => Promise<any>,
  ) => Promise<T | null>
  optimisticUpdate: <T extends { id: string }>(
    entityType: string,
    id: string,
    updates: Partial<T>,
    updateFn: (id: string, updates: Partial<T>) => Promise<any>,
    rollbackData?: any,
  ) => Promise<T | null>
  optimisticDelete: <T extends { id: string }>(
    entityType: string,
    id: string,
    deleteFn: (id: string) => Promise<any>,
    rollbackData?: T,
  ) => Promise<boolean>
  optimisticBatch: <R>(
    entityType: string,
    operations: Array<{ type: "create" | "update" | "delete"; id?: string; data?: any; rollbackData?: any }>,
    batchFn: () => Promise<R>,
  ) => Promise<R | null>
}

// Create the context
const OptimisticUpdatesContext = createContext<OptimisticUpdatesContextType | undefined>(undefined)

// Provider component
export function OptimisticUpdatesProvider({ children }: { children: ReactNode }) {
  const {
    pendingOperations,
    isPending,
    optimisticCreate: baseOptimisticCreate,
    optimisticUpdate: baseOptimisticUpdate,
    optimisticDelete: baseOptimisticDelete,
    optimisticBatch: baseOptimisticBatch,
  } = useOptimisticUpdates<any>()

  // Wrap the base functions to include entityType
  const optimisticCreate = async <T extends { id: string }>(
    entityType: string,
    data: Omit<T, "id">,
    createFn: (data: Omit<T, "id">) => Promise<any>,
  ): Promise<T | null> => {
    return baseOptimisticCreate(data, createFn)
  }

  const optimisticUpdate = async <T extends { id: string }>(
    entityType: string,
    id: string,
    updates: Partial<T>,
    updateFn: (id: string, updates: Partial<T>) => Promise<any>,
    rollbackData?: any,
  ): Promise<T | null> => {
    return baseOptimisticUpdate(id, updates, updateFn, rollbackData)
  }

  const optimisticDelete = async <T extends { id: string }>(
    entityType: string,
    id: string,
    deleteFn: (id: string) => Promise<any>,
    rollbackData?: T,
  ): Promise<boolean> => {
    return baseOptimisticDelete(id, deleteFn, rollbackData)
  }

  const optimisticBatch = async <R>(
    entityType: string,
    operations: Array<{ 
      type: "create" | "update" | "delete"
  id?: string
  data?: any;
  rollbackData?: any
}
>,
    batchFn: () => Promise<R>
  ): Promise<R | null> =>
{
  return baseOptimisticBatch(
      operations.map(op => ({
        type: op.type,
        id: op.id,
        data: op.data,
        rollbackData: op.rollbackData
      })),
      batchFn
    )
}

// Context value
const contextValue: OptimisticUpdatesContextType = {
  pendingOperations,
  isPending,
  optimisticCreate,
  optimisticUpdate,
  optimisticDelete,
  optimisticBatch,
}

return (
    <OptimisticUpdatesContext.Provider value={contextValue}>
      {children}
    </OptimisticUpdatesContext.Provider>
  )
}

// Custom hook to use the optimistic updates context
export function useOptimisticUpdatesContext() {
  const context = useContext(OptimisticUpdatesContext)

  if (context === undefined) {
    throw new Error("useOptimisticUpdatesContext must be used within an OptimisticUpdatesProvider")
  }

  return context
}
