"use client"

import { useState, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import type { WellnessEntry } from "@/schemas/wellness-schemas"

// Define the operation status type
type OperationStatus = "idle" | "pending" | "success" | "error"

// Define the hook return type
interface UseEntryOptimisticReturn {
  // State
  pendingEntries: Record<string, WellnessEntry>
  operationStatus: OperationStatus

  // Methods
  addEntryOptimistically: (
    entry: Omit<WellnessEntry, "id">,
    addEntryFn: (entry: Omit<WellnessEntry, "id">) => Promise<{ success: boolean; data?: WellnessEntry }>,
  ) => Promise<boolean>

  updateEntryOptimistically: (
    entryId: string,
    updates: Partial<WellnessEntry>,
    updateEntryFn: (id: string, updates: Partial<WellnessEntry>) => Promise<{ success: boolean; data?: WellnessEntry }>,
  ) => Promise<boolean>

  deleteEntryOptimistically: (
    entryId: string,
    deleteEntryFn: (id: string) => Promise<{ success: boolean }>,
  ) => Promise<boolean>

  isPendingEntry: (entryId: string) => boolean
  resetStatus: () => void
}

/**
 * Custom hook for optimistic updates specifically for wellness entries
 */
export function useEntryOptimistic(): UseEntryOptimisticReturn {
  // Track pending entries and operation status
  const [pendingEntries, setPendingEntries] = useState<Record<string, WellnessEntry>>({})
  const [operationStatus, setOperationStatus] = useState<OperationStatus>("idle")

  // Check if an entry is pending
  const isPendingEntry = useCallback(
    (entryId: string): boolean => {
      return entryId in pendingEntries
    },
    [pendingEntries],
  )

  // Reset operation status
  const resetStatus = useCallback(() => {
    setOperationStatus("idle")
  }, [])

  // Generate a temporary ID for new entries
  const generateTempId = useCallback(() => {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }, [])

  // Add entry with optimistic update
  const addEntryOptimistically = useCallback(
    async (
      entry: Omit<WellnessEntry, "id">,
      addEntryFn: (entry: Omit<WellnessEntry, "id">) => Promise<{ success: boolean; data?: WellnessEntry }>,
    ): Promise<boolean> => {
      // Generate a temporary ID
      const tempId = generateTempId()

      // Create temporary entry with the temp ID
      const tempEntry: WellnessEntry = {
        id: tempId,
        ...entry,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Update state to show pending operation
      setPendingEntries((prev) => ({ ...prev, [tempId]: tempEntry }))
      setOperationStatus("pending")

      try {
        // Perform the actual operation
        const result = await addEntryFn(entry)

        if (result.success && result.data) {
          // Update state with the real entry data
          setPendingEntries((prev) => {
            const updated = { ...prev }
            delete updated[tempId]
            return updated
          })
          setOperationStatus("success")

          // Show success toast
          toast({
            title: "Entry Added",
            description: "Your wellness entry has been added successfully.",
          })

          return true
        } else {
          throw new Error(result.message || "Failed to add entry")
        }
      } catch (error) {
        // Update state to show error
        setPendingEntries((prev) => {
          const updated = { ...prev }
          delete updated[tempId]
          return updated
        })
        setOperationStatus("error")

        // Show error toast
        toast({
          title: "Failed to Add Entry",
          description: error instanceof Error ? error.message : "An error occurred while adding your entry.",
          variant: "destructive",
        })

        return false
      }
    },
    [generateTempId, toast],
  )

  // Update entry with optimistic update
  const updateEntryOptimistically = useCallback(
    async (
      entryId: string,
      updates: Partial<WellnessEntry>,
      updateEntryFn: (
        id: string,
        updates: Partial<WellnessEntry>,
      ) => Promise<{ success: boolean; data?: WellnessEntry }>,
    ): Promise<boolean> => {
      // Create optimistic version of the updated entry
      const optimisticEntry: WellnessEntry = {
        id: entryId,
        ...updates,
        updatedAt: new Date(),
      } as WellnessEntry // Type assertion since we don't have the full entry

      // Update state to show pending operation
      setPendingEntries((prev) => ({ ...prev, [entryId]: optimisticEntry }))
      setOperationStatus("pending")

      try {
        // Perform the actual operation
        const result = await updateEntryFn(entryId, updates)

        if (result.success) {
          // Update state to remove pending status
          setPendingEntries((prev) => {
            const updated = { ...prev }
            delete updated[entryId]
            return updated
          })
          setOperationStatus("success")

          // Show success toast
          toast({
            title: "Entry Updated",
            description: "Your wellness entry has been updated successfully.",
          })

          return true
        } else {
          throw new Error(result.message || "Failed to update entry")
        }
      } catch (error) {
        // Update state to show error
        setPendingEntries((prev) => {
          const updated = { ...prev }
          delete updated[entryId]
          return updated
        })
        setOperationStatus("error")

        // Show error toast
        toast({
          title: "Failed to Update Entry",
          description: error instanceof Error ? error.message : "An error occurred while updating your entry.",
          variant: "destructive",
        })

        return false
      }
    },
    [toast],
  )

  // Delete entry with optimistic update
  const deleteEntryOptimistically = useCallback(
    async (entryId: string, deleteEntryFn: (id: string) => Promise<{ success: boolean }>): Promise<boolean> => {
      // Update state to show pending operation
      setPendingEntries((prev) => ({ ...prev, [entryId]: { id: entryId } as WellnessEntry }))
      setOperationStatus("pending")

      try {
        // Perform the actual operation
        const result = await deleteEntryFn(entryId)

        if (result.success) {
          // Update state to remove pending status
          setPendingEntries((prev) => {
            const updated = { ...prev }
            delete updated[entryId]
            return updated
          })
          setOperationStatus("success")

          // Show success toast
          toast({
            title: "Entry Deleted",
            description: "Your wellness entry has been deleted successfully.",
          })

          return true
        } else {
          throw new Error("Failed to delete entry")
        }
      } catch (error) {
        // Update state to show error
        setPendingEntries((prev) => {
          const updated = { ...prev }
          delete updated[entryId]
          return updated
        })
        setOperationStatus("error")

        // Show error toast
        toast({
          title: "Failed to Delete Entry",
          description: error instanceof Error ? error.message : "An error occurred while deleting your entry.",
          variant: "destructive",
        })

        return false
      }
    },
    [toast],
  )

  return {
    pendingEntries,
    operationStatus,
    addEntryOptimistically,
    updateEntryOptimistically,
    deleteEntryOptimistically,
    isPendingEntry,
    resetStatus,
  }
}
