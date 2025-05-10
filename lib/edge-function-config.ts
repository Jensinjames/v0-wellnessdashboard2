/**
 * Edge Function Configuration
 * Centralized configuration for Supabase Edge Functions
 */

// Track the status of the email service
let emailServiceAvailable = true
let lastEmailServiceCheck = 0
const EMAIL_SERVICE_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

/**
 * Check if the email service is likely available based on previous errors
 * @returns boolean True if the email service is likely available
 */
export function isEmailServiceLikelyAvailable(): boolean {
  // If we haven't checked in a while, assume it's available
  if (Date.now() - lastEmailServiceCheck > EMAIL_SERVICE_CHECK_INTERVAL) {
    emailServiceAvailable = true
  }

  return emailServiceAvailable
}

/**
 * Update the status of the email service
 * @param available Whether the email service is available
 */
export function updateEmailServiceStatus(available: boolean): void {
  emailServiceAvailable = available
  lastEmailServiceCheck = Date.now()

  // Log the status change
  console.log(`Email service status updated: ${available ? "Available" : "Unavailable"}`)
}

/**
 * Check if email service is available
 */
export function checkEmailServiceAvailability(): Promise<boolean> {
  return Promise.resolve(isEmailServiceLikelyAvailable())
}

// Base URL for edge functions
const getEdgeFunctionBaseUrl = (): string => {
  // Use environment variable if available
  if (process.env.SUPABASE_EDGE_FUNCTION_URL) {
    return process.env.SUPABASE_EDGE_FUNCTION_URL.replace(/\/$/, "")
  }

  // Fallback to default URL pattern based on project reference
  return "https://jziyyspmahgrvfkpuisa.supabase.co/functions/v1"
}

// Edge function endpoints
export const EDGE_FUNCTIONS = {
  // Wellness score calculation endpoint
  WELLNESS_SCORE: `${getEdgeFunctionBaseUrl()}/wellness-score`,

  // Health check endpoint to verify edge function availability
  HEALTH_CHECK: `${getEdgeFunctionBaseUrl()}/health-check`,

  // Email service status endpoint to check if email service is working
  EMAIL_SERVICE_STATUS: `${getEdgeFunctionBaseUrl()}/email-service-status`,
}

// Edge function configuration
export const EDGE_FUNCTION_CONFIG = {
  // Default timeout for edge function calls (in milliseconds)
  DEFAULT_TIMEOUT: 5000,

  // Maximum retries for edge function calls
  MAX_RETRIES: 2,

  // Retry delay (in milliseconds)
  RETRY_DELAY: 1000,

  // Debug level (0: none, 1: errors, 2: warnings, 3: info, 4: debug, 5: verbose)
  DEBUG_LEVEL: process.env.EDGE_FUNCTION_DEBUG_LEVEL ? Number.parseInt(process.env.EDGE_FUNCTION_DEBUG_LEVEL) : 1,
}

// Check if edge functions are configured
export const isEdgeFunctionConfigured = (): boolean => {
  return Boolean(process.env.SUPABASE_EDGE_FUNCTION_URL)
}

// Check if we're in development mode
export const isDevMode = (): boolean => {
  return process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "development" || process.env.NODE_ENV === "development"
}

// Check if debug mode is enabled
export const isDebugMode = (): boolean => {
  return process.env.NEXT_PUBLIC_DEBUG_MODE === "true" || process.env.DEBUG_MODE === "true"
}

// Get the site URL for redirects
export const getSiteUrl = (): string => {
  return process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")
}

// Email service configuration
export const EMAIL_SERVICE_CONFIG = {
  // Check interval for email service status (in milliseconds)
  STATUS_CHECK_INTERVAL: 60000 * 30, // 30 minutes

  // Last known status of the email service
  lastKnownStatus: {
    isAvailable: true,
    lastChecked: 0,
    errorCount: 0,
  },

  // Maximum number of consecutive errors before considering the service down
  MAX_ERROR_COUNT: 3,
}

/**
 * Get the URL for an edge function
 * @param functionName The name of the edge function
 * @returns The full URL to the edge function
 */
export function getEdgeFunctionUrl(functionName: string): string {
  return `${getEdgeFunctionBaseUrl()}/${functionName}`
}

/**
 * Check if an edge function is available
 * @param functionName The name of the edge function to check
 * @returns Promise resolving to true if the function is available
 */
export async function isEdgeFunctionAvailable(functionName: string): Promise<boolean> {
  try {
    const response = await fetch(`${getEdgeFunctionUrl(functionName)}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    return response.ok
  } catch (error) {
    console.error(`Error checking edge function availability (${functionName}):`, error)
    return false
  }
}

/**
 * Call an edge function
 * @param functionName The name of the edge function to call
 * @param payload The payload to send to the function
 * @param options Additional options for the function call
 * @returns Promise resolving to the function response
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  payload?: any,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE"
    headers?: Record<string, string>
    timeout?: number
  },
): Promise<{ data: T | null; error: Error | null }> {
  const method = options?.method || "POST"
  const timeout = options?.timeout || EDGE_FUNCTION_CONFIG.DEFAULT_TIMEOUT

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers,
    }

    // Add authorization if available on client
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    }

    const response = await fetch(getEdgeFunctionUrl(functionName), {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}
