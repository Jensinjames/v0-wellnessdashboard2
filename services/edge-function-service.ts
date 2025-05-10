/**
 * Edge Function Service
 * Service for interacting with Supabase Edge Functions
 */
import { callEdgeFunction } from "@/lib/edge-function-config"
import { measureEdgeFunctionCall } from "@/utils/edge-function-debug"

// User signup response
interface UserSignupResponse {
  user: any
  session?: any
  emailVerificationSent?: boolean
}

/**
 * Sign up a user using the Edge Function
 */
export async function signUpUserWithEdgeFunction(email: string, password: string): Promise<UserSignupResponse> {
  return measureEdgeFunctionCall(
    "user-signup",
    () => callEdgeFunction<UserSignupResponse>("user-signup", "POST", { email, password }),
    { email }, // Don't include password in logs
  )
}

/**
 * Verify an email using the Edge Function
 */
export async function verifyEmailWithEdgeFunction(token: string): Promise<{ success: boolean; message: string }> {
  return measureEdgeFunctionCall(
    "verify-email",
    () => callEdgeFunction<{ success: boolean; message: string }>("verify-email", "POST", { token }),
    { token },
  )
}

/**
 * Reset a password using the Edge Function
 */
export async function resetPasswordWithEdgeFunction(
  token: string,
  password: string,
): Promise<{ success: boolean; message: string }> {
  return measureEdgeFunctionCall(
    "reset-password",
    () => callEdgeFunction<{ success: boolean; message: string }>("reset-password", "POST", { token, password }),
    { token }, // Don't include password in logs
  )
}

/**
 * Check the health of the Edge Function
 */
export async function checkEdgeFunctionHealth(): Promise<{
  status: string
  version: string
  timestamp: number
}> {
  return measureEdgeFunctionCall(
    "health-check",
    () =>
      callEdgeFunction<{
        status: string
        version: string
        timestamp: number
      }>("health-check", "GET"),
    {},
  )
}
