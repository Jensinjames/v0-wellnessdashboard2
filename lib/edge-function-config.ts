/**
 * Edge Function Configuration
 * Provides utilities for interacting with Supabase Edge Functions
 */

import { createLogger } from "@/utils/logger"

const logger = createLogger("EdgeFunctionConfig")

// Get the Edge Function URL from environment variables
export const getEdgeFunctionUrl = async (): Promise<string | null> => {
  const url = process.env.SUPABASE_EDGE_FUNCTION_URL || null
  logger.debug(`Edge Function URL: ${url}`)
  return url
}

// Check if an Edge Function is available by making a health check request
export const isEdgeFunctionAvailable = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const available = response.ok
    logger.info(`Edge Function availability check: ${available ? "Available" : "Unavailable"}`, {
      url,
      status: response.status,
    })

    return available
  } catch (error) {
    logger.error("Edge Function availability check failed", { url }, error)
    return false
  }
}
