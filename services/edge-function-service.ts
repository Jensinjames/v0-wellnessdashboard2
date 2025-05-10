// Edge Function Service
// Utilities for interacting with Supabase Edge Functions

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createLogger } from "@/utils/logger"

const logger = createLogger("EdgeFunction")

// Options for calling an Edge Function
interface EdgeFunctionOptions {
  // Function name to call
  functionName: string

  // Payload to send to the function
  payload?: any

  // Number of retries (default: 1)
  retries?: number

  // Whether to include the user's JWT token (default: true)
  includeToken?: boolean
}

// User signup response interface
interface UserSignupResponse {
  user: any
  session?: any
  emailVerificationSent?: boolean
}

// Call an Edge Function with proper error handling
export async function callEdgeFunction<T = any>({
  functionName,
  payload = {},
  retries = 1,
  includeToken = true,
}: EdgeFunctionOptions): Promise<{ data: T | null; error: Error | null }> {
  let lastError: Error | null = null
  let attempts = 0

  while (attempts <= retries) {
    try {
      const supabase = createClientComponentClient()

      // Get the user's session if includeToken is true
      let headers = {}
      if (includeToken) {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.access_token) {
          headers = {
            Authorization: `Bearer ${session.access_token}`,
          }
        }
      }

      logger.info(`Calling Edge Function: ${functionName} (attempt ${attempts + 1}/${retries + 1})`)

      const { data, error } = await supabase.functions.invoke<T>(functionName, {
        body: payload,
        headers,
      })

      if (error) {
        lastError = new Error(error.message || "Edge Function error")
        logger.error(`Edge Function error (attempt ${attempts + 1}/${retries + 1}):`, error)
      } else {
        logger.info(`Edge Function ${functionName} completed successfully`)
        return { data, error: null }
      }
    } catch (error: any) {
      lastError = new Error(error.message || "An unexpected error occurred")
      logger.error(`Unexpected error calling Edge Function (attempt ${attempts + 1}/${retries + 1}):`, error)
    }

    attempts++
    if (attempts <= retries) {
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempts - 1)))
    }
  }

  return { data: null, error: lastError }
}

// Call an Edge Function with health check
export async function callEdgeFunctionWithHealthCheck<T = any>(
  options: EdgeFunctionOptions,
): Promise<{ data: T | null; error: Error | null; status: "available" | "unavailable" }> {
  try {
    // Check if Edge Functions are available
    const healthCheck = await callEdgeFunction<{ status: string }>({
      functionName: "health",
      retries: 0,
      includeToken: false,
    })

    if (healthCheck.error || healthCheck.data?.status !== "ok") {
      logger.warn("Edge Functions are unavailable")
      return { data: null, error: new Error("Edge Functions are unavailable"), status: "unavailable" }
    }

    // Call the actual Edge Function
    const result = await callEdgeFunction<T>(options)
    return { ...result, status: "available" }
  } catch (error: any) {
    logger.error("Error in Edge Function health check:", error)
    return { data: null, error: new Error(error.message || "An unexpected error occurred"), status: "unavailable" }
  }
}

// Sign up a user using the Edge Function
export async function signUpUserWithEdgeFunction(
  email: string,
  password: string,
): Promise<{ data: UserSignupResponse | null; error: Error | null }> {
  return callEdgeFunction<UserSignupResponse>({
    functionName: "user-signup",
    payload: { email, password },
    retries: 2,
  })
}

// Check the health of Edge Functions
export async function checkEdgeFunctionHealth(): Promise<{
  data: { status: string; version: string; timestamp: number } | null
  error: Error | null
}> {
  return callEdgeFunction<{ status: string; version: string; timestamp: number }>({
    functionName: "health-check",
    retries: 0,
    includeToken: false,
  })
}

// Verify an email using the Edge Function
export async function verifyEmailWithEdgeFunction(
  token: string,
): Promise<{ data: { success: boolean; message: string } | null; error: Error | null }> {
  return callEdgeFunction<{ success: boolean; message: string }>({
    functionName: "verify-email",
    payload: { token },
    retries: 1,
  })
}

// Reset a password using the Edge Function
export async function resetPasswordWithEdgeFunction(
  token: string,
  password: string,
): Promise<{ data: { success: boolean; message: string } | null; error: Error | null }> {
  return callEdgeFunction<{ success: boolean; message: string }>({
    functionName: "reset-password",
    payload: { token, password },
    retries: 1,
  })
}
