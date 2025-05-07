// This file centralizes access to environment variables related to Edge Functions

// Get the Edge Function URL with fallback for development
export const getEdgeFunctionUrl = (): string => {
  const url = process.env.SUPABASE_EDGE_FUNCTION_URL

  if (!url) {
    console.warn("SUPABASE_EDGE_FUNCTION_URL is not defined in environment variables")
    // Return a placeholder for development - this should be replaced in production
    return "https://jziyyspmahgrvfkpuisa.supabase.co/functions/v1"
  }

  return url
}

// Get the Edge Function authorization key if needed
export const getEdgeFunctionKey = (): string | null => {
  return process.env.SUPABASE_EDGE_FUNCTION_KEY || null
}

// Validate that all required environment variables are present
export const validateEdgeFunctionConfig = (): boolean => {
  const requiredVars = ["SUPABASE_EDGE_FUNCTION_URL"]
  const missing = requiredVars.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`)
    return false
  }

  return true
}
