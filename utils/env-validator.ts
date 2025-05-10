/**
 * Environment Variable Validator
 *
 * Validates required environment variables and provides helpful error messages
 */

interface EnvCheckResult {
  valid: boolean
  missing: string[]
  messages: string[]
}

// Check if required environment variables are set
export function checkRequiredEnvVars(keys: string[]): EnvCheckResult {
  const missing: string[] = []
  const messages: string[] = []

  if (typeof process === "undefined" || !process.env) {
    return {
      valid: false,
      missing: ["ENVIRONMENT"],
      messages: ["Environment variables are not accessible"],
    }
  }

  // Check each key
  for (const key of keys) {
    if (!process.env[key]) {
      missing.push(key)
      messages.push(`Missing ${key} environment variable`)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    messages,
  }
}

// Check Supabase environment variables
export function checkSupabaseEnvVars(): EnvCheckResult {
  return checkRequiredEnvVars(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])
}

// Check if Supabase URL is valid
export function validateSupabaseUrl(url?: string): boolean {
  if (!url) return false

  try {
    const parsedUrl = new URL(url)
    return (
      (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") && parsedUrl.hostname.includes("supabase")
    )
  } catch (e) {
    return false
  }
}

// Get a nice error message for missing environment variables
export function getEnvErrorMessage(result: EnvCheckResult): string {
  if (result.valid) return ""

  const baseMessage = "Missing required environment variables:"
  const missingVars = result.missing.join(", ")

  return `${baseMessage} ${missingVars}`
}
