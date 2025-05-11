/**
 * Database Permission Checker
 * Utility to check and fix database permissions
 */
import { getSupabaseClient } from "@/lib/supabase-client"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DBPermissions")

/**
 * Check if the current user has the necessary database permissions
 */
export async function checkDatabasePermissions(): Promise<{
  hasPermissions: boolean
  details: string[]
}> {
  try {
    const supabase = getSupabaseClient()
    const details: string[] = []

    // Check if we can read from profiles table
    const { error: profilesError } = await supabase.from("profiles").select("id").limit(1)

    if (profilesError) {
      details.push(`Cannot read from profiles: ${profilesError.message}`)
    } else {
      details.push("Can read from profiles table")
    }

    // Check if we can get the current user
    const { error: userError } = await supabase.auth.getUser()

    if (userError) {
      details.push(`Cannot get current user: ${userError.message}`)
    } else {
      details.push("Can get current user")
    }

    // Determine overall permission status
    const hasPermissions = !profilesError && !userError

    return { hasPermissions, details }
  } catch (error) {
    logger.error("Error checking database permissions:", error)
    return {
      hasPermissions: false,
      details: [`Error checking permissions: ${error instanceof Error ? error.message : String(error)}`],
    }
  }
}

/**
 * Attempt to recover from database permission issues
 */
export async function recoverFromPermissionIssues(): Promise<boolean> {
  try {
    // Reset the Supabase client to create a fresh instance
    const { resetSupabaseClient } = await import("@/lib/supabase-client")
    resetSupabaseClient()

    // Check permissions after reset
    const { hasPermissions } = await checkDatabasePermissions()

    return hasPermissions
  } catch (error) {
    logger.error("Error recovering from permission issues:", error)
    return false
  }
}
