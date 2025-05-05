"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import {
  processQueue,
  hasPendingOperations,
  getSyncStatus,
  clearSyncErrors,
  type SyncOperation,
  queueOperation,
} from "@/services/sync-service"

export function useSync() {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [syncErrors, setSyncErrors] = useState<string[]>([])

  // Update the sync status
  const updateSyncStatus = useCallback(() => {
    const status = getSyncStatus()
    setPendingCount(status.pendingCount)
    setIsSyncing(status.isSyncing)
    setLastSyncTime(status.lastSyncTime)
    setSyncErrors(status.errors)
  }, [])

  // Queue an operation
  const queueSync = useCallback(
    (operation: SyncOperation) => {
      queueOperation(operation)
      updateSyncStatus()
    },
    [updateSyncStatus],
  )

  // Sync data with the server
  const syncData = useCallback(async () => {
    if (!user || isSyncing || pendingCount === 0) return { success: true, errors: [] }

    setIsSyncing(true)
    const result = await processQueue(user.id)
    updateSyncStatus()
    return result
  }, [user, isSyncing, pendingCount, updateSyncStatus])

  // Clear sync errors
  const clearErrors = useCallback(() => {
    clearSyncErrors()
    updateSyncStatus()
  }, [updateSyncStatus])

  // Check for pending operations on mount and when online status changes
  useEffect(() => {
    updateSyncStatus()

    // Set up event listeners for online/offline status
    const handleOnline = () => {
      if (user && hasPendingOperations()) {
        syncData()
      }
    }

    window.addEventListener("online", handleOnline)

    // Check if we're online and have pending operations
    if (navigator.onLine && user && hasPendingOperations()) {
      syncData()
    }

    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [user, syncData, updateSyncStatus])

  // Set up an interval to check for pending operations
  useEffect(() => {
    const interval = setInterval(() => {
      updateSyncStatus()

      // If we're online, have a user, and have pending operations, sync
      if (navigator.onLine && user && hasPendingOperations() && !isSyncing) {
        syncData()
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [user, isSyncing, syncData, updateSyncStatus])

  return {
    pendingCount,
    isSyncing,
    lastSyncTime,
    syncErrors,
    syncData,
    queueSync,
    clearErrors,
  }
}
