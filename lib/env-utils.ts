// Environment detection
export const isServer = typeof window === "undefined"
export const isBrowser = !isServer

// Get environment (development, production, test)
export function getEnvironment(): string {
  if (isBrowser) {
    return process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "production"
  } else {
    return process.env.NODE_ENV || "production"
  }
}

// Check if we're in development mode
export function isDevelopment(): boolean {
  return getEnvironment() === "development"
}

// Check if we're in production mode
export function isProduction(): boolean {
  return getEnvironment() === "production"
}

// Check if we're in test mode
export function isTest(): boolean {
  return getEnvironment() === "test"
}

// Get debug mode status
export function isDebugMode(): boolean {
  if (isBrowser) {
    return process.env.NEXT_PUBLIC_DEBUG_MODE === "true" || localStorage.getItem("debug_mode") === "true"
  } else {
    return process.env.DEBUG_MODE === "true"
  }
}

// Safe access to environment variables
export function getEnvVariable(key: string, defaultValue = ""): string {
  // For client-side, only NEXT_PUBLIC_ variables are accessible
  if (isBrowser) {
    const publicKey = key.startsWith("NEXT_PUBLIC_") ? key : `NEXT_PUBLIC_${key}`
    return (process.env[publicKey] as string) || defaultValue
  }

  // Server-side can access any environment variable
  return (process.env[key] as string) || defaultValue
}

// Get app version
export function getAppVersion(): string {
  return getEnvVariable("NEXT_PUBLIC_APP_VERSION", "1.0.0")
}

// Validate required environment variables
export function validateRequiredEnvVars(requiredVars: string[]): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const key of requiredVars) {
    // For client-side, only check NEXT_PUBLIC_ variables
    if (isBrowser && !key.startsWith("NEXT_PUBLIC_")) continue

    if (!getEnvVariable(key)) {
      missing.push(key)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}
