import { getEnvVariable, validateRequiredEnvVars } from "@/lib/env-utils"

// Required environment variables for the application
const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_VERSION",
  "NEXT_PUBLIC_APP_ENVIRONMENT",
]

// Server-only required environment variables
const SERVER_ONLY_REQUIRED_ENV_VARS = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_JWT_SECRET"]

// Initialize and validate environment variables
export function initializeEnv(): { valid: boolean; missing: string[] } {
  // Check required environment variables
  const clientResult = validateRequiredEnvVars(REQUIRED_ENV_VARS)

  // Only check server variables on the server
  if (typeof window === "undefined") {
    const serverResult = validateRequiredEnvVars(SERVER_ONLY_REQUIRED_ENV_VARS)

    return {
      valid: clientResult.valid && serverResult.valid,
      missing: [...clientResult.missing, ...serverResult.missing],
    }
  }

  return clientResult
}

// Get application configuration
export function getAppConfig() {
  return {
    supabaseUrl: getEnvVariable("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: getEnvVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    appVersion: getEnvVariable("NEXT_PUBLIC_APP_VERSION", "1.0.0"),
    appEnvironment: getEnvVariable("NEXT_PUBLIC_APP_ENVIRONMENT", "production"),
    debugMode: getEnvVariable("NEXT_PUBLIC_DEBUG_MODE", "false") === "true",
  }
}

// Initialize environment on import
initializeEnv()
