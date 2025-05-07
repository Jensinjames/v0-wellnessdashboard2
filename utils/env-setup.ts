/**
 * Environment Variable Setup Utility
 *
 * This helper module provides functions to validate and format environment variables
 * to ensure proper application configuration.
 */

// List of required environment variables for the application
const REQUIRED_ENV_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

// List of optional environment variables with default values
const OPTIONAL_ENV_VARS = {
  NEXT_PUBLIC_APP_VERSION: "1.0.0",
  NEXT_PUBLIC_APP_ENVIRONMENT: "production",
  NEXT_PUBLIC_DEBUG_MODE: "false",
}

/**
 * Validates that all required environment variables are set.
 * Returns an object with any missing variables.
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Gets the value of an environment variable with fallback to a default value.
 */
export function getEnvVariable(name: string, defaultValue = ""): string {
  return process.env[name] || defaultValue
}

/**
 * Generates environment variable setup instructions for development.
 */
export function generateEnvSetupInstructions(): string {
  const allVars = [...REQUIRED_ENV_VARS, ...Object.keys(OPTIONAL_ENV_VARS)]

  let instructions = "# Required Environment Variables\n"

  for (const varName of allVars) {
    const defaultValue = (OPTIONAL_ENV_VARS as any)[varName] || ""
    instructions += `${varName}=${defaultValue}\n`
  }

  return instructions
}

/**
 * Gets the application version from environment or default.
 */
export function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"
}

/**
 * Logs environment variable warnings to console in development.
 */
export function logEnvironmentWarnings(): void {
  if (process.env.NODE_ENV !== "production") {
    const { valid, missing } = validateEnvironment()

    if (!valid) {
      console.warn("⚠️ Missing required environment variables:", missing)
      console.info("Create a .env.local file with the following:")
      console.info(generateEnvSetupInstructions())
    }
  }
}
