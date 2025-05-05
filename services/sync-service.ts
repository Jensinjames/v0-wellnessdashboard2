import { getSupabaseClient } from "@/lib/supabase-client"
import type { WellnessCategory, WellnessGoal, WellnessEntryData } from "@/types/wellness"

// Define the types of operations that can be queued
export type SyncOperation =
  | { type: "ADD_CATEGORY"; payload: WellnessCategory }
  | { type: "UPDATE_CATEGORY"; payload: { id: string; updates: Partial<WellnessCategory> } }
  | { type: "REMOVE_CATEGORY"; payload: string }
  | { type: "SET_GOAL"; payload: WellnessGoal }
  | { type: "ADD_ENTRY"; payload: WellnessEntryData }
  | { type: "UPDATE_ENTRY"; payload: { id: string; updates: Partial<WellnessEntryData> } }
  | { type: "REMOVE_ENTRY"; payload: string }

// Interface for the sync service
export interface SyncState {
  queue: SyncOperation[]
  isSyncing: boolean
  lastSyncTime: number | null
  syncErrors: string[]
}

// Initialize the sync state
const initialSyncState: SyncState = {
  queue: [],
  isSyncing: false,
  lastSyncTime: null,
  syncErrors: [],
}

// Load sync state from localStorage
export function loadSyncState(): SyncState {
  try {
    const savedState = localStorage.getItem("wellnessSyncState")
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      return {
        ...initialSyncState,
        ...parsedState,
        // Ensure queue is an array even if localStorage is corrupted
        queue: Array.isArray(parsedState.queue) ? parsedState.queue : [],
      }
    }
  } catch (error) {
    console.error("Error loading sync state:", error)
  }
  return initialSyncState
}

// Save sync state to localStorage
export function saveSyncState(state: SyncState): void {
  try {
    localStorage.setItem("wellnessSyncState", JSON.stringify(state))
  } catch (error) {
    console.error("Error saving sync state:", error)
  }
}

// Add an operation to the sync queue
export function queueOperation(operation: SyncOperation): void {
  const state = loadSyncState()

  // For update/remove operations, remove any previous operations on the same entity
  // to avoid conflicts and reduce queue size
  if (operation.type.includes("UPDATE") || operation.type.includes("REMOVE")) {
    const entityId = operation.type.includes("CATEGORY")
      ? operation.type === "REMOVE_CATEGORY"
        ? operation.payload
        : operation.payload.id
      : operation.type === "REMOVE_ENTRY"
        ? operation.payload
        : operation.payload.id

    state.queue = state.queue.filter((op) => {
      if (op.type.includes("CATEGORY") && operation.type.includes("CATEGORY")) {
        const opId =
          op.type === "REMOVE_CATEGORY" ? op.payload : op.type === "ADD_CATEGORY" ? op.payload.id : op.payload.id
        return opId !== entityId
      }
      if (op.type.includes("ENTRY") && operation.type.includes("ENTRY")) {
        const opId = op.type === "REMOVE_ENTRY" ? op.payload : op.type === "ADD_ENTRY" ? op.payload.id : op.payload.id
        return opId !== entityId
      }
      return true
    })
  }

  // Add the new operation to the queue
  state.queue.push(operation)
  saveSyncState(state)
}

// Process the sync queue
export async function processQueue(userId: string): Promise<{ success: boolean; errors: string[] }> {
  const state = loadSyncState()

  // If already syncing or queue is empty, return
  if (state.isSyncing || state.queue.length === 0) {
    return { success: true, errors: [] }
  }

  // Set syncing state
  state.isSyncing = true
  state.syncErrors = []
  saveSyncState(state)

  const supabase = getSupabaseClient()
  const errors: string[] = []

  try {
    // Process each operation in the queue
    for (let i = 0; i < state.queue.length; i++) {
      const operation = state.queue[i]

      try {
        switch (operation.type) {
          case "ADD_CATEGORY":
            await processAddCategory(supabase, userId, operation.payload)
            break

          case "UPDATE_CATEGORY":
            await processUpdateCategory(supabase, userId, operation.payload.id, operation.payload.updates)
            break

          case "REMOVE_CATEGORY":
            await processRemoveCategory(supabase, userId, operation.payload)
            break

          case "SET_GOAL":
            await processSetGoal(supabase, userId, operation.payload)
            break

          case "ADD_ENTRY":
            await processAddEntry(supabase, userId, operation.payload)
            break

          case "UPDATE_ENTRY":
            await processUpdateEntry(supabase, userId, operation.payload.id, operation.payload.updates)
            break

          case "REMOVE_ENTRY":
            await processRemoveEntry(supabase, userId, operation.payload)
            break
        }

        // Remove the processed operation from the queue
        state.queue.splice(i, 1)
        i-- // Adjust index since we removed an item
        saveSyncState(state)
      } catch (error) {
        console.error(`Error processing operation ${operation.type}:`, error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        errors.push(`Failed to sync ${operation.type}: ${errorMessage}`)
      }
    }

    // Update sync state
    state.isSyncing = false
    state.lastSyncTime = Date.now()
    state.syncErrors = errors
    saveSyncState(state)

    return { success: errors.length === 0, errors }
  } catch (error) {
    console.error("Error processing sync queue:", error)

    // Update sync state
    state.isSyncing = false
    state.syncErrors = [...errors, error instanceof Error ? error.message : "Unknown sync error"]
    saveSyncState(state)

    return { success: false, errors: state.syncErrors }
  }
}

// Helper functions for processing each operation type
async function processAddCategory(supabase: any, userId: string, category: WellnessCategory) {
  // Add category to database
  const { error } = await supabase.from("user_categories").insert({
    id: category.id,
    user_id: userId,
    name: category.name,
    description: category.description,
    icon: category.icon,
    color: category.color,
    enabled: category.enabled,
  })

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

async function processUpdateCategory(
  supabase: any,
  userId: string,
  categoryId: string,
  updates: Partial<WellnessCategory>,
) {
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
    const updatedMetricIds = new Set(updates.metrics.map((m) => m.id))

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

async function processRemoveCategory(supabase: any, userId: string, categoryId: string) {
  // Delete category from database (cascade will handle metrics)
  const { error } = await supabase.from("user_categories").delete().eq("id", categoryId).eq("user_id", userId)

  if (error) throw error
}

async function processSetGoal(supabase: any, userId: string, goal: WellnessGoal) {
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

async function processAddEntry(supabase: any, userId: string, entry: WellnessEntryData) {
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

async function processUpdateEntry(supabase: any, userId: string, entryId: string, updates: Partial<WellnessEntryData>) {
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

async function processRemoveEntry(supabase: any, userId: string, entryId: string) {
  // Delete entry from database (cascade will handle metrics)
  const { error } = await supabase.from("user_entries").delete().eq("id", entryId).eq("user_id", userId)

  if (error) throw error
}

// Check if there are pending operations
export function hasPendingOperations(): boolean {
  const state = loadSyncState()
  return state.queue.length > 0
}

// Get sync status information
export function getSyncStatus(): {
  pendingCount: number
  isSyncing: boolean
  lastSyncTime: number | null
  errors: string[]
} {
  const state = loadSyncState()
  return {
    pendingCount: state.queue.length,
    isSyncing: state.isSyncing,
    lastSyncTime: state.lastSyncTime,
    errors: state.syncErrors,
  }
}

// Clear sync errors
export function clearSyncErrors(): void {
  const state = loadSyncState()
  state.syncErrors = []
  saveSyncState(state)
}
