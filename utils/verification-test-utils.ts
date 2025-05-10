import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

/**
 * Debug utility to get the current verification token for a user
 * IMPORTANT: This should only be used in development/testing
 */
export async function getVerificationTokenForTesting(userId: string): Promise<{
  token: string | null
  expiresAt: string | null
  error: Error | null
}> {
  if (process.env.NODE_ENV === "production") {
    console.error("This function should not be used in production!")
    return { token: null, expiresAt: null, error: new Error("Not available in production") }
  }

  try {
    const supabase = createClientComponentClient<Database>()
    const { data, error } = await supabase
      .from("profiles")
      .select("verification_token, verification_token_expires_at")
      .eq("id", userId)
      .single()

    if (error) {
      return { token: null, expiresAt: null, error: new Error(error.message) }
    }

    return {
      token: data.verification_token,
      expiresAt: data.verification_token_expires_at,
      error: null,
    }
  } catch (error: any) {
    return {
      token: null,
      expiresAt: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Debug utility to manually set verification status
 * IMPORTANT: This should only be used in development/testing
 */
export async function setVerificationStatusForTesting(
  userId: string,
  type: "email" | "phone",
  verified: boolean,
): Promise<{ success: boolean; error: Error | null }> {
  if (process.env.NODE_ENV === "production") {
    console.error("This function should not be used in production!")
    return { success: false, error: new Error("Not available in production") }
  }

  try {
    const supabase = createClientComponentClient<Database>()
    const updateData = type === "email" ? { email_verified: verified } : { phone_verified: verified }

    const { error } = await supabase.from("profiles").update(updateData).eq("id", userId)

    if (error) {
      return { success: false, error: new Error(error.message) }
    }

    return { success: true, error: null }
  } catch (error: any) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Debug utility to reset verification status
 * IMPORTANT: This should only be used in development/testing
 */
export async function resetVerificationForTesting(userId: string): Promise<{ success: boolean; error: Error | null }> {
  if (process.env.NODE_ENV === "production") {
    console.error("This function should not be used in production!")
    return { success: false, error: new Error("Not available in production") }
  }

  try {
    const supabase = createClientComponentClient<Database>()

    const { error } = await supabase
      .from("profiles")
      .update({
        email_verified: false,
        phone_verified: false,
        verification_token: null,
        verification_token_expires_at: null,
      })
      .eq("id", userId)

    if (error) {
      return { success: false, error: new Error(error.message) }
    }

    return { success: true, error: null }
  } catch (error: any) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}
