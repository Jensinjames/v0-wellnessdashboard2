/**
 * Edge Function Configuration
 * Centralized configuration for Supabase Edge Functions
 */
import { checkEdgeFunctionAvailability } from "@/utils/edge-function-debug"

// Cache for edge function availability
let edgeFunctionAvailabilityCache: {
  url: string
  available: boolean
  timestamp: number
} | null = null

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000

/**
 * Get the Edge Function URL with validation
 */
export const getEdgeFunctionUrl = async (): Promise<string | null> => {
  const url = process.env.SUPABASE_EDGE_FUNCTION_URL

  if (!url) {
    console.warn("SUPABASE_EDGE_FUNCTION_URL is not defined in environment variables")
    return null
  }

  // Check if the edge function is available (with caching)
  const isAvailable = await isEdgeFunctionAvailable(url)

  if (!isAvailable) {
    console.warn(`Edge function at ${url} is not available`)
    return null
  }

  return url
}

/**
 * Check if an edge function is available (with caching)
 */
export const isEdgeFunctionAvailable = async (url: string): Promise<boolean> => {
  // Check cache first
  if (
    edgeFunctionAvailabilityCache &&
    edgeFunctionAvailabilityCache.url === url &&
    Date.now() - edgeFunctionAvailabilityCache.timestamp < CACHE_TTL
  ) {
    return edgeFunctionAvailabilityCache.available
  }

  // Check availability
  const available = await checkEdgeFunctionAvailability(url)

  // Update cache
  edgeFunctionAvailabilityCache = {
    url,
    available,
    timestamp: Date.now(),
  }

  return available
}

/**
 * Get the Edge Function authorization key
 */
export const getEdgeFunctionKey = (): string | null => {
  const key = process.env.SUPABASE_EDGE_FUNCTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!key) {
    console.warn("No authorization key found for Edge Function")
  }

  return key
}

/**
 * Get headers for Edge Function requests
 */
export const getEdgeFunctionHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  const key = getEdgeFunctionKey()
  if (key) {
    headers["Authorization"] = `Bearer ${key}`
  }

  return headers
}

/**
 * Validate that all required environment variables are present
 */
export const validateEdgeFunctionConfig = (): {
  valid: boolean
  missing: string[]
} => {
  const requiredVars = ["SUPABASE_EDGE_FUNCTION_URL"]
  const missing = requiredVars.filter((varName) => !process.env[varName])

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Build a complete Edge Function URL
 */
export const buildEdgeFunctionUrl = async (functionName: string): Promise<string | null> => {
  const baseUrl = await getEdgeFunctionUrl()

  if (!baseUrl) {
    return null
  }

  // Ensure the base URL doesn't end with a slash
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl

  // Ensure the function name doesn't start with a slash
  const normalizedFunctionName = functionName.startsWith("/") ? functionName.slice(1) : functionName

  return `${normalizedBaseUrl}/${normalizedFunctionName}`
}

/**
 * Call an Edge Function with proper error handling
 */
export const callEdgeFunction = async <T>(\
  functionName: string,
  method: string = "POST",
  body?: any
)
: Promise<T> =>
{
  const url = await buildEdgeFunctionUrl(functionName)

  if (!url) {
    throw new Error(`Failed to build URL for Edge Function: ${functionName}`)
  }

  const headers = getEdgeFunctionHeaders()

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as { error?: string }
      throw new Error(errorData.error || `Edge Function ${functionName} failed with status ${response.status}`)
    }

    return data as T
  } catch (error) {
    console.error(`Edge Function ${functionName} error:`, error)
    throw error
  }
}
