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

// Base URL for edge functions - CLIENT SAFE
const getEdgeFunctionBaseUrl = (): string => {
  // Use environment variable if available - but only the URL, not the key
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`
  }

  // Fallback to default URL pattern based on project reference
  return "https://jziyyspmahgrvfkpuisa.supabase.co/functions/v1"
}

// Edge function endpoints - CLIENT SAFE
export const EDGE_FUNCTIONS = {
  // Wellness score calculation endpoint
  WELLNESS_SCORE: `${getEdgeFunctionBaseUrl()}/wellness-score`,

  // Health check endpoint to verify edge function availability
  HEALTH_CHECK: `${getEdgeFunctionBaseUrl()}/health-check`,

  // Email service status endpoint to check if email service is working
  EMAIL_SERVICE_STATUS: `${getEdgeFunctionBaseUrl()}/email-service-status`,
}

// Edge function configuration - CLIENT SAFE
export const EDGE_FUNCTION_CONFIG = {
  // Default timeout for edge function calls (in milliseconds)
  DEFAULT_TIMEOUT: 5000,

  // Maximum retries for edge function calls
  MAX_RETRIES: 2,

  // Retry delay (in milliseconds)
  RETRY_DELAY: 1000,

  // Debug level (0: none, 1: errors, 2: warnings, 3: info, 4: debug, 5: verbose)
  DEBUG_LEVEL: process.env.NEXT_PUBLIC_DEBUG_LEVEL ? Number.parseInt(process.env.NEXT_PUBLIC_DEBUG_LEVEL) : 1,
}

// Check if edge functions are configured - CLIENT SAFE
export const isEdgeFunctionConfigured = (): boolean => {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
}

// Check if we're in development mode - CLIENT SAFE
export const isDevMode = (): boolean => {
  return process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "development" || process.env.NODE_ENV === "development"
}

// Check if debug mode is enabled - CLIENT SAFE
export const isDebugMode = (): boolean => {
  return process.env.NEXT_PUBLIC_DEBUG_MODE === "true" || process.env.DEBUG_MODE === "true"
}

// Get the site URL for redirects - CLIENT SAFE
export const getSiteUrl = (): string => {
  return process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")
}

// Email service configuration - CLIENT SAFE
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
