"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"

// Define the types of operations that can be queued
type SyncOperation =
  | { type: "ADD_CATEGORY"; payload: any }
  | { type: "UPDATE_CATEGORY"; payload: { id: string; updates: any } }
  | { type: "REMOVE_CATEGORY"; payload: string }
  | { type: "SET_GOAL"; payload: any }
  | { type: "ADD_ENTRY"; payload: any }
  | { type: "UPDATE_ENTRY"; payload: { id: string; updates: any } }
  | { type: "REMOVE_ENTRY"; payload: string }

export function useSync() {
  const { user } = useAuth()
  const [syncQueue, setSyncQueue] = useState<SyncOperation[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem("syncQueue")
      if (savedQueue) {
        setSyncQueue(JSON.parse(savedQueue))
      }

      const savedLastSync = localStorage.getItem("lastSyncTime")
      if (savedLastSync) {
        setLastSyncTime(new Date(savedLastSync))
      }
    } catch (error) {
      console.error("Error loading sync queue from localStorage:", error)
    }
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("syncQueue", JSON.stringify(syncQueue))
    setPendingCount(syncQueue.length)
  }, [syncQueue])

  // Save last sync time to localStorage
  useEffect(() => {
    if (lastSyncTime) {
      localStorage.setItem("lastSyncTime", lastSyncTime.toISOString())
    }
  }, [lastSyncTime])

  // Listen for online status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network connection restored, attempting to sync...")
      syncData()
    }

    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  // Queue an operation for syncing
  const queueSync = useCallback((operation: SyncOperation) => {
    setSyncQueue((prev) => [...prev, operation])
  }, [])

  // Process the sync queue
  const syncData = useCallback(async () => {
    if (!user || syncQueue.length === 0 || isSyncing || !navigator.onLine) {
      return
    }

    setIsSyncing(true)
    setSyncError(null)

    try {
      const supabase = getSupabaseClient()
      const queueCopy = [...syncQueue]
      const successfulOps: number[] = []

      for (let i = 0; i < queueCopy.length; i++) {
        const operation = queueCopy[i]

        try {
          switch (operation.type) {
            case "ADD_CATEGORY":
              await processAddCategory(supabase, operation.payload, user.id)
              break
            case "UPDATE_CATEGORY":
              await processUpdateCategory(supabase, operation.payload.id, operation.payload.updates, user.id)
              break
            case "REMOVE_CATEGORY":
              await processRemoveCategory(supabase, operation.payload, user.id)
              break
            case "SET_GOAL":
              await processSetGoal(supabase, operation.payload, user.id)
              break
            case "ADD_ENTRY":
              await processAddEntry(supabase, operation.payload, user.id)
              break
            case "UPDATE_ENTRY":
              await processUpdateEntry(supabase, operation.payload.id, operation.payload.updates, user.id)
              break
            case "REMOVE_ENTRY":
              await processRemoveEntry(supabase, operation.payload, user.id)
              break
          }

          // Mark operation as successful
          successfulOps.push(i)
        } catch (error) {
          console.error(`Error processing operation ${operation.type}:`, error)

          // If it's a network error, stop processing and keep all remaining operations in queue
          if (
            error instanceof Error &&
            (error.message.includes("Failed to fetch") || error.message.includes("Network Error"))
          ) {
            break
          }

          // For other errors, mark as successful (remove from queue) but log the error
          successfulOps.push(i)
        }
      }

      // Remove successful operations from queue
      setSyncQueue((prev) => prev.filter((_, index) => !successfulOps.includes(index)))

      // Update last sync time
      setLastSyncTime(new Date())
    } catch (error) {
      console.error("Error syncing data:", error)
      setSyncError(error instanceof Error ? error.message : "Unknown error syncing data")
    } finally {
      setIsSyncing(false)
    }
  }, [user, syncQueue, isSyncing])

  // Helper functions for processing different operation types
  async function processAddCategory(supabase: any, category: any, userId: string) {
    // Add category to database
    const { data, error } = await supabase
      .from("user_categories")
      .insert({
        id: category.id,
        user_id: userId,
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        enabled: category.enabled,
      })
      .select()

    if (error) throw error

    // Add metrics to database
    for (const metric of category.metrics) {
      const { error: metricError } = await supabase.from("user_metrics").insert({
        id: metric.id,
        category_id: category.id,
        name: metric.name,
        description: metric.description,
        unit: metric.unit,
        min_value: metric.min,
        max_value: metric.max,
        step_value: metric.step,
        default_value: metric.defaultValue,
        default_goal: metric.defaultGoal,
      })

      if (metricError) throw metricError
    }
  }

  async function processUpdateCategory(supabase: any, categoryId: string, updates: any, userId: string) {
    // Update category in database
    const { error } = await supabase
      .from("user_categories")
      .update({
        name: updates.name,
        description: updates.description,
        icon: updates.icon,
        color: updates.color,
        enabled: updates.enabled,
      })
      .eq("id", categoryId)
      .eq("user_id", userId)

    if (error) throw error

    // If metrics are updated, handle them
    if (updates.metrics) {
      // Get current metrics
      const { data: currentMetrics, error: fetchError } = await supabase
        .from("user_metrics")
        .select("id")
        .eq("category_id", categoryId)

      if (fetchError) throw fetchError

      const currentMetricIds = new Set(currentMetrics.map((m: any) => m.id))
      const updatedMetricIds = new Set(updates.metrics.map((m: any) => m.id))

      // Delete metrics that are no longer in the updated list
      for (const metricId of currentMetricIds) {
        if (!updatedMetricIds.has(metricId)) {
          const { error: deleteError } = await supabase
            .from("user_metrics")
            .delete()
            .eq("id", metricId)
            .eq("category_id", categoryId)

          if (deleteError) throw deleteError
        }
      }

      // Update or insert metrics
      for (const metric of updates.metrics) {
        if (currentMetricIds.has(metric.id)) {
          // Update existing metric
          const { error: updateError } = await supabase
            .from("user_metrics")
            .update({
              name: metric.name,
              description: metric.description,
              unit: metric.unit,
              min_value: metric.min,
              max_value: metric.max,
              step_value: metric.step,
              default_value: metric.defaultValue,
              default_goal: metric.defaultGoal,
            })
            .eq("id", metric.id)
            .eq("category_id", categoryId)

          if (updateError) throw updateError
        } else {
          // Insert new metric
          const { error: insertError } = await supabase.from("user_metrics").insert({
            id: metric.id,
            category_id: categoryId,
            name: metric.name,
            description: metric.description,
            unit: metric.unit,
            min_value: metric.min,
            max_value: metric.max,
            step_value: metric.step,
            default_value: metric.defaultValue,
            default_goal: metric.defaultGoal,
          })

          if (insertError) throw insertError
        }
      }
    }
  }

  async function processRemoveCategory(supabase: any, categoryId: string, userId: string) {
    // Delete category from database (cascade will handle metrics)
    const { error } = await supabase.from("user_categories").delete().eq("id", categoryId).eq("user_id", userId)

    if (error) throw error
  }

  async function processSetGoal(supabase: any, goal: any, userId: string) {
    const metricKey = `${goal.categoryId}:${goal.metricId}`

    // Check if goal exists
    const { data: existingGoal, error: checkError } = await supabase
      .from("user_goals")
      .select("id")
      .eq("user_id", userId)
      .eq("metric_id", metricKey)
      .maybeSingle()

    if (checkError) throw checkError

    if (existingGoal) {
      // Update existing goal
      const { error: updateError } = await supabase
        .from("user_goals")
        .update({ target_value: goal.value })
        .eq("id", existingGoal.id)

      if (updateError) throw updateError
    } else {
      // Insert new goal
      const { error: insertError } = await supabase.from("user_goals").insert({
        user_id: userId,
        metric_id: metricKey,
        target_value: goal.value,
        start_date: new Date().toISOString().split("T")[0],
      })

      if (insertError) throw insertError
    }
  }

  async function processAddEntry(supabase: any, entry: any, userId: string) {
    // Format entry date
    const entryDate = new Date(entry.date)
    entryDate.setHours(0, 0, 0, 0)
    const formattedDate = entryDate.toISOString().split("T")[0]

    // Check if entry exists for this date
    const { data: existingEntry, error: checkError } = await supabase
      .from("user_entries")
      .select("id")
      .eq("user_id", userId)
      .eq("entry_date", formattedDate)
      .maybeSingle()

    if (checkError) throw checkError

    let entryId: string

    if (existingEntry) {
      // Use existing entry
      entryId = existingEntry.id
    } else {
      // Create new entry
      const { data: newEntry, error: insertError } = await supabase
        .from("user_entries")
        .insert({
          user_id: userId,
          entry_date: formattedDate,
        })
        .select()

      if (insertError) throw insertError
      if (!newEntry || newEntry.length === 0) throw new Error("Failed to create entry")

      entryId = newEntry[0].id
    }

    // Add metrics for the entry
    for (const metric of entry.metrics) {
      const metricKey = `${metric.categoryId}:${metric.metricId}`

      // Check if metric exists for this entry
      const { data: existingMetric, error: metricCheckError } = await supabase
        .from("entry_metrics")
        .select("id")
        .eq("entry_id", entryId)
        .eq("metric_id", metricKey)
        .maybeSingle()

      if (metricCheckError) throw metricCheckError

      if (existingMetric) {
        // Update existing metric
        const { error: updateError } = await supabase
          .from("entry_metrics")
          .update({ value: metric.value })
          .eq("id", existingMetric.id)

        if (updateError) throw updateError
      } else {
        // Insert new metric
        const { error: insertError } = await supabase.from("entry_metrics").insert({
          entry_id: entryId,
          metric_id: metricKey,
          value: metric.value,
        })

        if (insertError) throw insertError
      }
    }
  }

  async function processUpdateEntry(supabase: any, entryId: string, updates: any, userId: string) {
    // If date is updated
    if (updates.date) {
      const formattedDate = new Date(updates.date).toISOString().split("T")[0]

      const { error: updateError } = await supabase
        .from("user_entries")
        .update({ entry_date: formattedDate })
        .eq("id", entryId)
        .eq("user_id", userId)

      if (updateError) throw updateError
    }

    // If metrics are updated
    if (updates.metrics) {
      // Get current metrics
      const { data: currentMetrics, error: fetchError } = await supabase
        .from("entry_metrics")
        .select("id, metric_id")
        .eq("entry_id", entryId)

      if (fetchError) throw fetchError

      // Create a map of current metrics
      const currentMetricMap = new Map(currentMetrics.map((m: any) => [m.metric_id, m.id]))

      // Process each updated metric
      for (const metric of updates.metrics) {
        const metricKey = `${metric.categoryId}:${metric.metricId}`

        if (currentMetricMap.has(metricKey)) {
          // Update existing metric
          const { error: updateError } = await supabase
            .from("entry_metrics")
            .update({ value: metric.value })
            .eq("id", currentMetricMap.get(metricKey))

          if (updateError) throw updateError
        } else {
          // Insert new metric
          const { error: insertError } = await supabase.from("entry_metrics").insert({
            entry_id: entryId,
            metric_id: metricKey,
            value: metric.value,
          })

          if (insertError) throw insertError
        }
      }
    }
  }

  async function processRemoveEntry(supabase: any, entryId: string, userId: string) {
    // Delete entry from database (cascade will handle metrics)
    const { error } = await supabase.from("user_entries").delete().eq("id", entryId).eq("user_id", userId)

    if (error) throw error
  }

  return {
    syncData,
    queueSync,
    isSyncing,
    lastSyncTime,
    syncError,
    pendingCount,
  }
}
