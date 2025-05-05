import { createClient } from "@supabase/supabase-js"

// Types for our analytics data
export interface FormEvent {
  formId: string
  eventType: "attempt" | "success" | "error" | "field_error"
  timestamp: number
  duration?: number
  fieldName?: string
  errorMessage?: string
  metadata?: Record<string, any>
}

export interface FormAnalytics {
  formId: string
  attempts: number
  successes: number
  errors: number
  fieldErrors: Record<string, number>
  averageDuration: number
  successRate: number
  lastUpdated: number
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Local storage key
const ANALYTICS_STORAGE_KEY = "wellness_form_analytics"

// Get analytics from local storage
const getLocalAnalytics = (): Record<string, FormAnalytics> => {
  if (typeof window === "undefined") return {}

  try {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error("Error reading form analytics from localStorage:", error)
    return {}
  }
}

// Save analytics to local storage
const saveLocalAnalytics = (analytics: Record<string, FormAnalytics>) => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(analytics))
  } catch (error) {
    console.error("Error saving form analytics to localStorage:", error)
  }
}

// Track a form event
export const trackFormEvent = async (event: Omit<FormEvent, "timestamp">): Promise<void> => {
  const timestamp = Date.now()
  const fullEvent: FormEvent = { ...event, timestamp }

  // Update local analytics
  updateLocalAnalytics(fullEvent)

  // Send to Supabase if available
  try {
    await supabase.from("form_events").insert([fullEvent])
  } catch (error) {
    console.error("Error sending form event to Supabase:", error)
  }
}

// Update local analytics with a new event
const updateLocalAnalytics = (event: FormEvent): void => {
  const analytics = getLocalAnalytics()
  const formAnalytics = analytics[event.formId] || {
    formId: event.formId,
    attempts: 0,
    successes: 0,
    errors: 0,
    fieldErrors: {},
    averageDuration: 0,
    successRate: 0,
    lastUpdated: Date.now(),
  }

  // Update analytics based on event type
  switch (event.eventType) {
    case "attempt":
      formAnalytics.attempts++
      break
    case "success":
      formAnalytics.successes++
      if (event.duration) {
        // Update average duration
        const totalDuration = formAnalytics.averageDuration * (formAnalytics.successes - 1) + event.duration
        formAnalytics.averageDuration = totalDuration / formAnalytics.successes
      }
      break
    case "error":
      formAnalytics.errors++
      break
    case "field_error":
      if (event.fieldName) {
        formAnalytics.fieldErrors[event.fieldName] = (formAnalytics.fieldErrors[event.fieldName] || 0) + 1
      }
      break
  }

  // Calculate success rate
  formAnalytics.successRate = formAnalytics.attempts > 0 ? (formAnalytics.successes / formAnalytics.attempts) * 100 : 0

  formAnalytics.lastUpdated = Date.now()

  // Save updated analytics
  analytics[event.formId] = formAnalytics
  saveLocalAnalytics(analytics)
}

// Get analytics for all forms
export const getAllFormAnalytics = (): Record<string, FormAnalytics> => {
  return getLocalAnalytics()
}

// Get analytics for a specific form
export const getFormAnalytics = (formId: string): FormAnalytics | null => {
  const analytics = getLocalAnalytics()
  return analytics[formId] || null
}

// Clear analytics for a specific form
export const clearFormAnalytics = (formId: string): void => {
  const analytics = getLocalAnalytics()
  delete analytics[formId]
  saveLocalAnalytics(analytics)
}

// Clear all analytics
export const clearAllFormAnalytics = (): void => {
  saveLocalAnalytics({})
}

// Fetch analytics from Supabase
export const fetchAnalyticsFromSupabase = async (): Promise<Record<string, FormAnalytics>> => {
  try {
    const { data, error } = await supabase.from("form_events").select("*").order("timestamp", { ascending: false })

    if (error) throw error

    // Process events into analytics
    const analytics: Record<string, FormAnalytics> = {}

    data.forEach((event: FormEvent) => {
      if (!analytics[event.formId]) {
        analytics[event.formId] = {
          formId: event.formId,
          attempts: 0,
          successes: 0,
          errors: 0,
          fieldErrors: {},
          averageDuration: 0,
          successRate: 0,
          lastUpdated: 0,
        }
      }

      // Update analytics based on event
      updateAnalyticsWithEvent(analytics[event.formId], event)
    })

    // Calculate final metrics
    Object.values(analytics).forEach((formAnalytics) => {
      formAnalytics.successRate =
        formAnalytics.attempts > 0 ? (formAnalytics.successes / formAnalytics.attempts) * 100 : 0
    })

    return analytics
  } catch (error) {
    console.error("Error fetching analytics from Supabase:", error)
    return {}
  }
}

// Helper to update analytics with an event
const updateAnalyticsWithEvent = (analytics: FormAnalytics, event: FormEvent): void => {
  switch (event.eventType) {
    case "attempt":
      analytics.attempts++
      break
    case "success":
      analytics.successes++
      if (event.duration) {
        const totalDuration = analytics.averageDuration * (analytics.successes - 1) + event.duration
        analytics.averageDuration = totalDuration / analytics.successes
      }
      break
    case "error":
      analytics.errors++
      break
    case "field_error":
      if (event.fieldName) {
        analytics.fieldErrors[event.fieldName] = (analytics.fieldErrors[event.fieldName] || 0) + 1
      }
      break
  }

  analytics.lastUpdated = Math.max(analytics.lastUpdated, event.timestamp)
}
