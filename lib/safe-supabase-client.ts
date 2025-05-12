import { createClient } from "@/lib/supabase-client"
import type { AuthError } from "@supabase/supabase-js"

/**
 * Safely executes a Supabase auth operation with proper error handling
 * @param operation Function that performs a Supabase operation
 * @returns Result of the operation with standardized error handling
 */
export async function safeAuthOperation<T>(
  operation: (supabase: ReturnType<typeof createClient>) => Promise<T>,
): Promise<{ data: T | null; error: AuthError | null }> {
  try {
    const supabase = createClient()
    const result = await operation(supabase)
    return { data: result, error: null }
  } catch (err) {
    console.error("Supabase operation error:", err)
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : "An unexpected error occurred",
        name: "OperationError",
        status: 500,
      } as AuthError,
    }
  }
}

/**
 * Safely gets the current session
 * @returns The current session or null with error information
 */
export async function safeGetSession() {
  return safeAuthOperation(async (supabase) => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data
  })
}

/**
 * Safely updates the user password
 * @param password New password
 * @returns Result of the password update operation
 */
export async function safeUpdatePassword(password: string) {
  return safeAuthOperation(async (supabase) => {
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    return data
  })
}

/**
 * Safely exchanges a code for a session
 * @param code The code to exchange
 * @returns Result of the code exchange operation
 */
export async function safeExchangeCodeForSession(code: string) {
  return safeAuthOperation(async (supabase) => {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    return data
  })
}
