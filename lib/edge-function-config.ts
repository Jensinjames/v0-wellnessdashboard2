/**
 * Edge Function Configuration
 * Configuration and utilities for Supabase Edge Functions
 */

// Email service status tracking
let emailServiceAvailable = true

// Check if email service is likely available
export async function isEmailServiceLikelyAvailable(): Promise<boolean> {
  try {
    // Simple check - in a real app, this might make an API call to verify
    // For now, we'll just assume it's available if we're in a browser environment
    return typeof window !== "undefined"
  } catch (error) {
    console.error("Error checking email service:", error)
    return false
  }
}

/**
 * Update the status of the email service
 */
export function updateEmailServiceStatus(available: boolean): void {
  emailServiceAvailable = available
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

// Get edge function URL
export function getEdgeFunctionUrl(functionName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  return `${baseUrl}/functions/v1/${functionName}`
}

// Check if edge functions are enabled
export function areEdgeFunctionsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_ENABLED === "true"
}
