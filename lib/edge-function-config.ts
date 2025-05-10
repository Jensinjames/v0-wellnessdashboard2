/**
 * Edge Function Configuration
 * Provides configuration and utilities for edge functions
 */
import { createLogger } from "@/utils/logger"

const logger = createLogger("EdgeFunctionConfig")

// Track the status of the email service
let emailServiceAvailable = true
let lastEmailServiceCheck = 0
const EMAIL_SERVICE_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

// Edge function endpoints
export const EDGE_FUNCTION_ENDPOINTS = {
  WELLNESS_SCORE: "/functions/v1/wellness-score",
}

// Edge function configuration
export const EDGE_FUNCTION_CONFIG = {
  DEFAULT_TIMEOUT: 10000, // 10 seconds
  RETRY_COUNT: 2,
  RETRY_DELAY: 1000, // 1 second
}

/**
 * Edge Function Configuration
 *
 * This module provides configuration and utilities for working with Supabase Edge Functions.
 */

// Get the Edge Function URL from environment variables
export async function getEdgeFunctionUrlFromEnv(): Promise<string> {
  return process.env.SUPABASE_EDGE_FUNCTION_URL || ""
}

// Get the Edge Function key from environment variables
export async function getEdgeFunctionKey(): Promise<string> {
  return process.env.SUPABASE_EDGE_FUNCTION_KEY || ""
}

// Check if email service is likely available
export function isEmailServiceLikelyAvailable(): boolean {
  // In production, we assume the email service is available
  if (process.env.NODE_ENV === "production") {
    return true
  }

  // In development, check if we're mocking email success
  if (process.env.NEXT_PUBLIC_MOCK_EMAIL_SUCCESS === "true") {
    return true
  }

  // Default to true to avoid blocking functionality
  return true
}

// Check if email service is available
export async function checkEmailServiceAvailability(): Promise<boolean> {
  return isEmailServiceLikelyAvailable()
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
// export function checkEmailServiceAvailability(): Promise<boolean> {
//   return Promise.resolve(isEmailServiceLikelyAvailable())
// }

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
// export const EDGE_FUNCTION_CONFIG = {
//   // Default timeout for edge function calls (in milliseconds)
//   DEFAULT_TIMEOUT: 5000,

//   // Maximum retries for edge function calls
//   MAX_RETRIES: 2,

//   // Retry delay (in milliseconds)
//   RETRY_DELAY: 1000,

//   // Debug level (0: none, 1: errors, 2: warnings, 3: info, 4: debug, 5: verbose)
//   DEBUG_LEVEL: process.env.EDGE_FUNCTION_DEBUG_LEVEL ? Number.parseInt(process.env.EDGE_FUNCTION_DEBUG_LEVEL) : 1,
// }

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
 */
export function getEdgeFunctionUrl(functionName: keyof typeof EDGE_FUNCTION_ENDPOINTS): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const endpoint = EDGE_FUNCTION_ENDPOINTS[functionName]

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined")
  }

  return `${baseUrl}${endpoint}`
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
 * Call an edge function with retry logic
 */
export async function callEdgeFunction<T = any>(
  functionName: keyof typeof EDGE_FUNCTION_ENDPOINTS,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: any
    timeout?: number
    retryCount?: number
    retryDelay?: number
  } = {},
): Promise<T> {
  const {
    method = "POST",
    headers = {},
    body,
    timeout = EDGE_FUNCTION_CONFIG.DEFAULT_TIMEOUT,
    retryCount = EDGE_FUNCTION_CONFIG.RETRY_COUNT,
    retryDelay = EDGE_FUNCTION_CONFIG.RETRY_DELAY,
  } = options

  const url = getEdgeFunctionUrl(functionName)

  // Add default headers
  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  }

  // Create request options
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  }

  // Create AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    // Add signal to request options
    requestOptions.signal = controller.signal

    // Try to fetch with retries
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        if (attempt > 0) {
          logger.debug(`Retrying edge function call (${attempt}/${retryCount}): ${functionName}`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt))
        }

        const response = await fetch(url, requestOptions)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Edge function error (${response.status}): ${errorText}`)
        }

        return await response.json()
      } catch (error: any) {
        lastError = error

        // Don't retry if aborted or if we've reached the retry limit
        if (error.name === "AbortError" || attempt === retryCount) {
          throw error
        }

        logger.warn(`Edge function call failed (${attempt}/${retryCount}): ${error.message}`)
      }
    }

    throw lastError || new Error(`Failed to call edge function: ${functionName}`)
  } finally {
    clearTimeout(timeoutId)
  }
}
